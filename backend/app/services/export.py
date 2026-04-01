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
                # Vendor
                "Fournisseur": data.get("vendor_name"),
                "Adresse Fournisseur": data.get("vendor_address"),
                "Téléphone Fournisseur": data.get("vendor_phone"),
                "Email Fournisseur": data.get("vendor_email"),
                "SIRET": data.get("vendor_siret"),
                # Client
                "Client": data.get("client_name"),
                "Adresse Client": data.get("client_address"),
                # Invoice info
                "N° Facture": data.get("invoice_number"),
                "Date": data.get("date"),
                "Date d'échéance": data.get("due_date"),
                "Conditions de paiement": data.get("payment_terms"),
                # Amounts
                "Total HT": data.get("total_ht"),
                "Taux TVA": data.get("tva_rate"),
                "TVA": data.get("tva"),
                "Remise": data.get("discount"),
                "Total TTC": data.get("total_ttc"),
                "Devise": data.get("currency"),
                # Moroccan fiscal identifiers
                "ICE": data.get("ice"),
                "Identifiant Fiscal (IF)": data.get("if_number"),
                "Registre de Commerce (RC)": data.get("rc"),
                "CNSS": data.get("cnss"),
                "Taxe Professionnelle (Patente)": data.get("patente"),
            }
        )

    df = pd.DataFrame(rows)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Invoices")

    buf.seek(0)
    return buf.read()
