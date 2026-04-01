import asyncio
import logging
import uuid
from typing import Annotated

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.invoice import Invoice
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.invoice import InvoiceOut, UploadResponse
from app.services import extractor as extractor_svc
from app.services import ocr as ocr_svc

router = APIRouter(prefix="/api/invoices", tags=["invoices"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
}


async def _process_invoice(invoice_id: str, file_bytes: bytes, content_type: str, db: AsyncSession):
    """Background task: OCR → LLM extraction → persist result."""
    try:
        if content_type == "application/pdf":
            raw_text = ocr_svc.extract_text_from_pdf(file_bytes)
        else:
            raw_text = ocr_svc.extract_text_from_image(file_bytes)

        logger.info("OCR result for %s:\n%s", invoice_id, raw_text)

        extraction = extractor_svc.extract_invoice_data(raw_text)

        result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalar_one_or_none()
        if invoice:
            invoice.data = extraction.model_dump()
            invoice.status = "done"
            await db.commit()
    except Exception as e:
        logger.exception("Invoice processing failed for %s: %s", invoice_id, e)
        result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalar_one_or_none()
        if invoice:
            invoice.status = "failed"
            await db.commit()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_invoice(
    file: UploadFile,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    invoice_id = str(uuid.uuid4())

    invoice = Invoice(
        id=invoice_id,
        user_id=current_user.id,
        filename=file.filename or "unknown",
        status="processing",
    )
    db.add(invoice)
    await db.commit()

    # Fire-and-forget background task
    asyncio.create_task(_process_invoice(invoice_id, file_bytes, file.content_type, db))

    return UploadResponse(id=invoice_id, status="processing")


@router.get("", response_model=list[InvoiceOut])
async def list_invoices(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.user_id == current_user.id).order_by(Invoice.created_at.desc())
    )
    return result.scalars().all()


@router.get("/export/all")
async def export_all(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import Response

    from app.services.export import invoices_to_excel

    result = await db.execute(
        select(Invoice).where(Invoice.user_id == current_user.id).order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()
    xlsx_bytes = invoices_to_excel(list(invoices))

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=invoices.xlsx"},
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.delete(invoice)
    await db.commit()


@router.get("/{invoice_id}/export/excel")
async def export_invoice_excel(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import Response

    from app.services.export import invoices_to_excel

    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == current_user.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    xlsx_bytes = invoices_to_excel([invoice])
    invoice_number = (invoice.data or {}).get("invoice_number") if invoice.data else None
    base_name = invoice_number or invoice.filename.rsplit(".", 1)[0]
    safe_name = base_name.replace("/", "-").replace("\\", "-") + ".xlsx"

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={safe_name}"},
    )
