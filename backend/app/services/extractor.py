import json
import logging
import re

from openai import OpenAI

logger = logging.getLogger(__name__)

from app.config import settings
from app.schemas.invoice import ExtractionData

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

EXTRACTION_PROMPT = """You are an invoice data extraction assistant.
Extract the following fields from the invoice text and return ONLY a valid JSON object with no extra text or explanation.

Rules:
- All date fields must be formatted as DD/MM/YYYY. Never return a raw number as a date. Be precise — read the day, month and year carefully.
- "date" is the invoice issue date (date de facture / date d'émission). It is NOT the due date.
- "due_date" is the payment deadline (date d'échéance / date limite de paiement).
- All amount fields must be strings rounded to 2 decimal places (e.g. "174.01").
- For currency: return ONLY the code or symbol (e.g. "EUR", "$"). No extra words.
- If the same value appears twice (OCR duplicate), include it only once.
- If a field is not found, return null.
- Moroccan fiscal fields: "ice" = Identifiant Commun de l'Entreprise (15 digits), "if_number" = Identifiant Fiscal, "rc" = Registre de Commerce, "cnss" = Caisse Nationale de Sécurité Sociale number, "patente" = Taxe professionnelle number.

Return this exact JSON structure:
{{
  "vendor_name": "...",
  "vendor_address": "...",
  "vendor_phone": "...",
  "vendor_email": "...",
  "vendor_siret": "...",
  "client_name": "...",
  "client_address": "...",
  "invoice_number": "...",
  "date": "DD/MM/YYYY",
  "due_date": "DD/MM/YYYY",
  "payment_terms": "...",
  "total_ht": "...",
  "tva": "...",
  "tva_rate": "...",
  "total_ttc": "...",
  "currency": "...",
  "discount": "...",
  "ice": "...",
  "if_number": "...",
  "rc": "...",
  "cnss": "...",
  "patente": "..."
}}

Invoice text:
{raw_text}"""


def extract_invoice_data(raw_text: str) -> ExtractionData:
    prompt = EXTRACTION_PROMPT.format(raw_text=raw_text[:12000])

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )

    content = (response.choices[0].message.content or "").strip()
    logger.info("LLM raw response: %s", content)
    if not content:
        raise ValueError("LLM returned empty response")

    # Strip markdown code fences if present
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)

    parsed = json.loads(content)

    # Normalize any numeric values to strings
    for field, val in parsed.items():
        if val is not None and not isinstance(val, str):
            parsed[field] = str(val)

    return ExtractionData(**parsed)
