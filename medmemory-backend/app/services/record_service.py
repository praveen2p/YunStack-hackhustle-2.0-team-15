import json
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.crypto import decrypt_text, encrypt_text
from app.models.user import AuditLog, AuditStatus, ConsentRequest, ConsentType, MedicalRecord, User
from app.schemas.schemas import RecordCreate, RecordOut
from app.services.document_ai_service import ProcessedDocument


def _get_patient_by_hp_id(hp_id: str, db: Session) -> User:
    patient = db.query(User).filter(User.hp_id == hp_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {hp_id} not found")
    return patient


def get_records(patient_id: int, db: Session) -> list[RecordOut]:
    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.date.desc(), MedicalRecord.created_at.desc())
        .all()
    )
    return [record_to_out(record) for record in records]


def record_to_out(record: MedicalRecord) -> RecordOut:
    item = RecordOut.model_validate(record)
    item.content = decrypt_text(item.content)
    return item


def upload_record(
    req: RecordCreate,
    provider: User,
    db: Session,
    *,
    file_name: str | None = None,
    file_content_type: str | None = None,
    file_size: int | None = None,
    storage_provider: str | None = None,
    storage_key: str | None = None,
) -> dict:
    patient = _get_patient_by_hp_id(req.patient_hp_id, db)

    # Create a pending consent request — patient must approve before record is active
    consent = ConsentRequest(
        type=ConsentType.upload,
        requester_id=provider.id,
        requester_name=provider.name,
        organization_type=provider.role,
        patient_id=patient.id,
        reason=f"Upload: {req.title}",
    )
    db.add(consent)

    # Stage the record (status=pending until patient approves)
    record = MedicalRecord(
        patient_id=patient.id,
        provider_id=provider.id,
        provider_name=provider.name,
        type=req.type,
        title=req.title,
        content=encrypt_text(req.content),
        file_name=file_name,
        file_content_type=file_content_type,
        file_size=file_size,
        storage_provider=storage_provider,
        storage_key=storage_key,
        date=req.date,
        status="pending",
    )
    db.add(record)
    db.flush()
    consent.record_id = record.id

    _log(db, provider, "UPLOAD_REQUEST", str(patient.id), f"Upload request for {req.title}")
    db.commit()
    from app.services.ai_insights_service import invalidate_risk_cache

    invalidate_risk_cache(patient.id)
    db.refresh(record)
    return {"message": "Upload submitted — awaiting patient consent", "record_id": record.id}


def upload_processed_record(
    patient_hp_id: str,
    record_type: str,
    processed: ProcessedDocument,
    provider: User,
    db: Session,
    *,
    file_name: str | None = None,
    file_content_type: str | None = None,
    file_size: int | None = None,
    storage_key: str | None = None,
) -> dict:
    content = json.dumps({
        "structured_data": processed.extracted_data,
        "summary": processed.summary,
        "document_type": processed.record_type,
        "risk": processed.risk_label,
        "confidence": processed.risk_confidence,
        "source_file": file_name,
    })
    payload = RecordCreate(
        patient_hp_id=patient_hp_id,
        type=processed.record_type,
        title=processed.title,
        content=content,
        date=datetime.now(timezone.utc),
    )
    return upload_record(
        payload,
        provider,
        db,
        file_name=file_name,
        file_content_type=file_content_type,
        file_size=file_size,
        storage_provider="mongodb" if storage_key else None,
        storage_key=storage_key,
    )


def get_records_by_hp_id(hp_id: str, db: Session) -> list[RecordOut]:
    patient = _get_patient_by_hp_id(hp_id, db)
    return get_records(patient.id, db)


def _log(db: Session, user: User, action: str, resource_id: str, details: str):
    db.add(AuditLog(
        user_id=user.id,
        user_name=user.name,
        action=action,
        resource_id=resource_id,
        details=details,
        status=AuditStatus.success,
        timestamp=datetime.now(timezone.utc),
    ))
