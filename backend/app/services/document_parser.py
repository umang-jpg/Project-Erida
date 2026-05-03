from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Literal

from app.schemas import Chunk

_ALLOWED = {".pdf", ".txt", ".md"}
LiteralFileType = Literal["pdf", "txt", "md"]


@dataclass
class ParseOutcome:
    parsed_text: str
    chunks: list[Chunk]
    error_message: str | None = None


class DocumentParser:
    def __init__(self, chunk_size_chars: int, chunk_overlap_chars: int) -> None:
        self.chunk_size_chars = chunk_size_chars
        self.chunk_overlap_chars = chunk_overlap_chars

    @staticmethod
    def file_kind(filename: str) -> LiteralFileType | None:
        suf = Path(filename).suffix.lower()
        if suf not in _ALLOWED:
            return None
        if suf == ".pdf":
            return "pdf"
        if suf == ".md":
            return "md"
        return "txt"

    def extract_text(self, filename: str, raw_bytes: bytes) -> tuple[str | None, str | None]:
        suf = Path(filename).suffix.lower()
        try:
            if suf == ".pdf":
                return self._parse_pdf(raw_bytes), None
            return raw_bytes.decode("utf-8", errors="replace"), None
        except Exception as exc:  # pragma: no cover — defensive extraction
            return None, str(exc)

    def build_chunks(self, document_id: str, filename: str, full_text: str) -> list[Chunk]:
        if not full_text.strip():
            return []
        step = max(1, self.chunk_size_chars - self.chunk_overlap_chars)
        chunks_raw: list[Chunk] = []
        position = 0
        length = len(full_text)
        while position < length:
            segment_end = min(position + self.chunk_size_chars, length)
            fragment = full_text[position:segment_end]
            if fragment.strip():
                start_ln = _character_index_to_line_number(full_text, position)
                end_ln = _character_index_to_line_number(full_text, segment_end - 1)
                chunks_raw.append(
                    Chunk(
                        document_id=document_id,
                        chunk_index=len(chunks_raw),
                        content=fragment,
                        source_ref=f"{filename} lines {start_ln}-{end_ln}",
                    )
                )
            position += step

        return [Chunk(**{**c.model_dump(), "chunk_index": i}) for i, c in enumerate(chunks_raw)]

    def parse_document(self, document_id: str, filename: str, raw_bytes: bytes) -> ParseOutcome:
        parsed, err_msg = self.extract_text(filename, raw_bytes)
        if parsed is None:
            msg = err_msg or "Could not extract text from file."
            return ParseOutcome(parsed_text="", chunks=[], error_message=msg)
        chunks = self.build_chunks(document_id, filename, parsed)
        return ParseOutcome(parsed_text=parsed, chunks=chunks)

    @staticmethod
    def _parse_pdf(raw_bytes: bytes) -> str:
        import pdfplumber

        pages: list[str] = []
        with pdfplumber.open(BytesIO(raw_bytes)) as pdf:
            for page in pdf.pages:
                pages.append(page.extract_text() or "")
        return "\n".join(pages)


def _character_index_to_line_number(full_text: str, character_index: int) -> int:
    if character_index < 0:
        return 1
    clipped = character_index + 1
    snippet = full_text[:clipped]
    return snippet.count("\n") + 1 if snippet else 1
