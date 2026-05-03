from __future__ import annotations

import json
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

EntityFolder = Literal["sessions", "documents", "reports", "messages"]

_VALID_FOLDER = {"sessions", "documents", "reports", "messages"}


def _iso_now() -> str:
    return datetime.now(UTC).isoformat()


def _encode_json(payload: dict[str, Any]) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False, default=str)


def _sanitize_id(entity_id: str) -> None:
    if not entity_id or re.search(r"[^a-fA-F0-9\-]", entity_id):
        raise ValueError("Invalid id format")


class JsonDirectoryStore:
    """File-based persistence: `{data_root}/{entity_type}/{uuid}.json`."""

    def __init__(self, data_root: Path) -> None:
        self.data_root = Path(data_root).resolve()
        self.uploads_dir = self.data_root / "uploads"
        for name in _VALID_FOLDER:
            (self.data_root / name).mkdir(parents=True, exist_ok=True)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    def _folder(self, entity_type: EntityFolder) -> Path:
        if entity_type not in _VALID_FOLDER:
            raise ValueError(f"Unknown entity type: {entity_type}")
        path = self.data_root / entity_type
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save(self, entity_type: EntityFolder, entity_id: str, data: dict[str, Any]) -> dict[str, Any]:
        _sanitize_id(entity_id)
        path = self._folder(entity_type) / f"{entity_id}.json"
        path.write_text(_encode_json(data), encoding="utf-8")
        return data

    def load(self, entity_type: EntityFolder, entity_id: str) -> dict[str, Any] | None:
        _sanitize_id(entity_id)
        path = self._folder(entity_type) / f"{entity_id}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def list_entities(self, entity_type: EntityFolder) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for path in sorted(self._folder(entity_type).glob("*.json"), key=lambda p: p.stat().st_mtime):
            rows.append(json.loads(path.read_text(encoding="utf-8")))
        rows.sort(key=lambda r: str(r.get("created_at") or ""), reverse=True)
        return rows

    def update(
        self, entity_type: EntityFolder, entity_id: str, partial_data: dict[str, Any]
    ) -> dict[str, Any]:
        existing = self.load(entity_type, entity_id)
        if existing is None:
            raise KeyError(f"{entity_type} not found: {entity_id}")
        merged = {**existing, **partial_data}
        return self.save(entity_type, entity_id, merged)

    @staticmethod
    def new_uuid4() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def utc_now_iso() -> str:
        return _iso_now()
