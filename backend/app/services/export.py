import io

import pandas as pd

from app.models.invoice import Invoice


def invoices_to_excel(invoices: list[Invoice]) -> bytes:
    rows = []
    for inv in invoices:
        data = inv.data or {}
        rows.append(
            {
                "ID": inv.id,
                "Filename": inv.filename,
                "Status": inv.status,
                "Created At": inv.created_at.isoformat() if inv.created_at else None,
                "Vendor Name": data.get("vendor_name"),
                "Invoice Number": data.get("invoice_number"),
                "Date": data.get("date"),
                "Total HT": data.get("total_ht"),
                "TVA": data.get("tva"),
                "Total TTC": data.get("total_ttc"),
                "Currency": data.get("currency"),
            }
        )

    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Invoices")

    buf.seek(0)
    return buf.read()
