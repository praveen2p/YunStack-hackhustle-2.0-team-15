from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.mongodb import mongo_document_store
from app.models.user import AuditLog, AuditStatus, ConsentRequest, ConsentStatus, ConsentType, MedicalRecord, User
from app.schemas.schemas import ConsentAction, ConsentOut


def get_patient_consent(patient_id: int, db: Session) -> list[ConsentOut]:
    items = db.query(ConsentRequest).filter(ConsentRequest.patient_id == patient_id).all()
    return [ConsentOut.model_validate(c) for c in items]


def action_consent(consent_id: int, action: ConsentAction, patient: User, db: Session) -> ConsentOut:
    consent = db.get(ConsentRequest, consent_id)
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")
    if consent.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not your consent request")
    if consent.status != ConsentStatus.pending:
        raise HTTPException(status_code=400, detail="Already resolved")

    consent.status = action.status

    deleted_record_id: int | None = None
    if consent.record_id:
        record = db.get(MedicalRecord, consent.record_id)
        if record:
            if consent.type == ConsentType.upload:
                if action.status == ConsentStatus.approved:
                    record.status = "active"
                else:
                    record.status = "archived"
            elif consent.type == ConsentType.delete and action.status == ConsentStatus.approved:
                deleted_record_id = record.id
                mongo_document_store.delete_document(record.storage_key)
                for linked_consent in db.query(ConsentRequest).filter(ConsentRequest.record_id == record.id).all():
                    linked_consent.record_id = None
                db.delete(record)

    db.add(AuditLog(
        user_id=patient.id,
        user_name=patient.name,
        action=f"CONSENT_{action.status.value.upper()}",
        resource_id=str(consent_id),
        details=(
            f"Patient permanently deleted record #{deleted_record_id} via consent request #{consent_id}"
            if deleted_record_id
            else f"Patient {action.status.value} consent request #{consent_id}"
        ),
        status=AuditStatus.success,
        timestamp=datetime.now(timezone.utc),
    ))
    db.commit()
    from app.services.ai_insights_service import invalidate_risk_cache

    invalidate_risk_cache(patient.id)
    db.refresh(consent)
    return ConsentOut.model_validate(consent)


def get_org_consent_status(requester_id: int, db: Session) -> list[ConsentOut]:
    items = db.query(ConsentRequest).filter(ConsentRequest.requester_id == requester_id).all()
    return [ConsentOut.model_validate(c) for c in items]
