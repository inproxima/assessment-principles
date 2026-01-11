from __future__ import annotations

import io
from pathlib import Path

from docx import Document
from pypdf import PdfReader


class TextExtractionError(RuntimeError):
    pass


def _extract_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            t = page.extract_text() or ""
            t = t.strip()
            if t:
                parts.append(t)
        return "\n\n".join(parts).strip()
    except Exception as e:
        raise TextExtractionError(f"Failed to extract PDF text: {e}") from e


def _extract_docx(data: bytes) -> str:
    try:
        doc = Document(io.BytesIO(data))
        parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
        return "\n".join(parts).strip()
    except Exception as e:
        raise TextExtractionError(f"Failed to extract DOCX text: {e}") from e


def extract_text_from_upload(*, filename: str | None, content_type: str | None, data: bytes) -> str:
    """
    Extract text from a supported upload (PDF, DOCX).
    Uses filename extension as primary signal; falls back to content-type.
    """
    if not data:
        raise TextExtractionError("Uploaded file is empty")

    ext = ""
    if filename:
        ext = Path(filename).suffix.lower().lstrip(".")

    ct = (content_type or "").lower()

    if ext == "pdf" or ct == "application/pdf":
        text = _extract_pdf(data)
    elif ext == "docx" or ct in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        text = _extract_docx(data)
    else:
        raise TextExtractionError(f"Unsupported file type: filename={filename!r} content_type={content_type!r}")

    if not text:
        raise TextExtractionError("No text could be extracted from the uploaded file")
    return text

