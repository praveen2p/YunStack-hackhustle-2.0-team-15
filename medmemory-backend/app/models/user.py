import hashlib
import json
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy import event
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from app.core.database import Base


# ---------- enums ----------

class UserRole(str, PyEnum):
    patient = "patient"
    doctor = "doctor"
    lab = "lab"
    pharmacist = "pharmacist"
    clinic = "clinic"
    admin = "admin"


class RecordType(str, PyEnum):
    lab = "lab"
    prescription = "prescription"
    imaging = "imaging"
    consultation = "consultation"
    vaccination = "vaccination"
    discharge = "discharge"


class RecordStatus(str, PyEnum):
    active = "active"
    pending = "pending"
    archived = "archived"


class ConsentType(str, PyEnum):
    upload = "upload"
    modify = "modify"
    delete = "delete"


class ConsentStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AuditStatus(str, PyEnum):
    success = "success"
    warning = "warning"
    error = "error"


# ---------- models ----------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    hp_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    records: Mapped[list["MedicalRecord"]] = relationship(
        back_populates="patient", foreign_keys="MedicalRecord.patient_id"
    )
    consent_requests: Mapped[list["ConsentRequest"]] = relationship(
        back_populates="patient", foreign_keys="ConsentRequest.patient_id"
    )


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    provider_name: Mapped[str] = mapped_column(String(255))
    type: Mapped[RecordType] = mapped_column(Enum(RecordType))
    title: Mapped[str] = mapped_column(String(500))
    content: Mapped[str] = mapped_column(Text)
    file_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[RecordStatus] = mapped_column(Enum(RecordStatus), default=RecordStatus.active)
    date: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    patient: Mapped["User"] = relationship(back_populates="records", foreign_keys=[patient_id])


class ConsentRequest(Base):
    __tablename__ = "consent_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[ConsentType] = mapped_column(Enum(ConsentType))
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    requester_name: Mapped[str] = mapped_column(String(255))
    organization_type: Mapped[str] = mapped_column(String(100))
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    record_id: Mapped[int | None] = mapped_column(ForeignKey("medical_records.id"), nullable=True)
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[ConsentStatus] = mapped_column(Enum(ConsentStatus), default=ConsentStatus.pending)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    patient: Mapped["User"] = relationship(foreign_keys=[patient_id], back_populates="consent_requests")
    requester: Mapped["User"] = relationship(foreign_keys=[requester_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    user_name: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(255))
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details: Mapped[str] = mapped_column(Text)
    previous_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entry_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[AuditStatus] = mapped_column(Enum(AuditStatus), default=AuditStatus.success)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


def _audit_hash_payload(log: AuditLog, previous_hash: str | None) -> str:
    payload = {
        "user_id": log.user_id,
        "user_name": log.user_name,
        "action": log.action,
        "resource_id": log.resource_id,
        "details": log.details,
        "status": log.status.value if isinstance(log.status, AuditStatus) else str(log.status),
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "previous_hash": previous_hash,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


@event.listens_for(Session, "before_flush")
def hash_audit_logs(session: Session, flush_context, instances):
    new_logs = [item for item in session.new if isinstance(item, AuditLog) and not item.entry_hash]
    if not new_logs:
        return

    latest = (
        session.query(AuditLog)
        .filter(AuditLog.entry_hash.isnot(None))
        .order_by(AuditLog.id.desc())
        .first()
    )
    previous_hash = latest.entry_hash if latest else None

    for log in new_logs:
        if log.timestamp is None:
            log.timestamp = datetime.now(timezone.utc)
        log.previous_hash = previous_hash
        log.entry_hash = hashlib.sha256(_audit_hash_payload(log, previous_hash).encode("utf-8")).hexdigest()
        previous_hash = log.entry_hash
