from datetime import datetime

from pydantic import BaseModel


class ExtractionData(BaseModel):
    # Vendor
    vendor_name: str | None = None
    vendor_address: str | None = None
    vendor_phone: str | None = None
    vendor_email: str | None = None
    vendor_siret: str | None = None

    # Client
    client_name: str | None = None
    client_address: str | None = None

    # Invoice info
    invoice_number: str | None = None
    date: str | None = None
    due_date: str | None = None
    payment_terms: str | None = None

    # Amounts
    total_ht: str | None = None
    tva: str | None = None
    tva_rate: str | None = None
    total_ttc: str | None = None
    currency: str | None = None
    discount: str | None = None

    # Moroccan fiscal identifiers
    ice: str | None = None
    if_number: str | None = None
    rc: str | None = None
    cnss: str | None = None
    patente: str | None = None


class InvoiceOut(BaseModel):
    id: str
    filename: str
    status: str
    created_at: datetime
    data: ExtractionData | None = None

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    id: str
    status: str
