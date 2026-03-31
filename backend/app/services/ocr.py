import io

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

from app.config import settings

pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF. Falls back to OCR for scanned pages."""
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            page_text = page.get_text().strip()
            if page_text:
                text_parts.append(page_text)
            else:
                # Scanned page — render and OCR
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                ocr_text = pytesseract.image_to_string(img, lang="fra+eng")
                text_parts.append(ocr_text.strip())

    return "\n".join(text_parts)


def extract_text_from_image(file_bytes: bytes) -> str:
    """OCR an image file directly."""
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img, lang="fra+eng")
