from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from app.core.config import settings
from app.core.crypto import decrypt_bytes, encrypt_bytes


class MongoDocumentStore:
    def __init__(self) -> None:
        self._client: Any | None = None
        self._db: Any | None = None
        self._bucket: Any | None = None

    @property
    def enabled(self) -> bool:
        return settings.mongodb_enabled

    def connect(self) -> None:
        if not self.enabled or self._client is not None:
            return

        try:
            import gridfs
            from pymongo import MongoClient
        except ImportError as exc:
            if settings.MONGODB_REQUIRED:
                raise RuntimeError("Install pymongo to enable MongoDB document storage") from exc
            return

        self._client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        self._client.admin.command("ping")
        self._db = self._client[settings.MONGODB_DATABASE]
        self._bucket = gridfs.GridFS(self._db, collection=settings.MONGODB_GRIDFS_BUCKET)

    def close(self) -> None:
        if self._client is not None:
            self._client.close()
        self._client = None
        self._db = None
        self._bucket = None

    def save_document(
        self,
        *,
        data: bytes,
        filename: str,
        content_type: str | None,
        patient_hp_id: str,
        provider_id: int,
        record_type: str,
        extracted_data: dict[str, Any],
    ) -> str | None:
        try:
            self.connect()
        except Exception as exc:
            if settings.MONGODB_REQUIRED:
                raise HTTPException(status_code=503, detail=f"MongoDB unavailable: {exc}") from exc
            return None

        if self._bucket is None:
            return None

        file_id = self._bucket.put(
            encrypt_bytes(data),
            filename=filename,
            contentType=content_type,
            metadata={
                "patient_hp_id": patient_hp_id,
                "provider_id": provider_id,
                "record_type": record_type,
                "extracted_data": extracted_data,
                "encrypted": True,
                "encryption": "AES-256-GCM",
                "uploaded_at": datetime.now(timezone.utc),
            },
        )
        return str(file_id)

    def get_document(self, storage_key: str) -> tuple[bytes, str, str | None]:
        try:
            self.connect()
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB unavailable: {exc}") from exc

        if self._bucket is None:
            raise HTTPException(status_code=404, detail="Document storage is not configured")

        try:
            from bson import ObjectId
        except ImportError as exc:
            raise HTTPException(status_code=503, detail="Install pymongo to read MongoDB documents") from exc

        try:
            grid_out = self._bucket.get(ObjectId(storage_key))
        except Exception as exc:
            raise HTTPException(status_code=404, detail="Stored document not found") from exc

        content_type = getattr(grid_out, "content_type", None) or getattr(grid_out, "contentType", None)
        encrypted = bool(getattr(grid_out, "metadata", None) and grid_out.metadata.get("encrypted"))
        data = grid_out.read()
        return decrypt_bytes(data) if encrypted else data, grid_out.filename, content_type

    def delete_document(self, storage_key: str | None) -> None:
        if not storage_key:
            return

        try:
            self.connect()
        except Exception as exc:
            if settings.MONGODB_REQUIRED:
                raise HTTPException(status_code=503, detail=f"MongoDB unavailable: {exc}") from exc
            return

        if self._bucket is None:
            return

        try:
            from bson import ObjectId
        except ImportError as exc:
            if settings.MONGODB_REQUIRED:
                raise HTTPException(status_code=503, detail="Install pymongo to delete MongoDB documents") from exc
            return

        try:
            self._bucket.delete(ObjectId(storage_key))
        except Exception:
            # The SQL record is authoritative; a missing GridFS object should not block consent resolution.
            return


mongo_document_store = MongoDocumentStore()
