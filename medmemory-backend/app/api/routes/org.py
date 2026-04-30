from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User
from app.schemas.schemas import (
    AuditOut,
    ConsentOut,
    DeleteRequest,
    ModifyRequest,
    RecordCreate,
    RecordOut,
    UserUpdate,
    UserOut,
)
from app.services import consent_service, record_service
from app.services.document_ai_service import process_uploaded_document
from app.core.mongodb import mongo_document_store

router = APIRouter(prefix="/api/org", tags=["org"])

_org = require_role("doctor", "lab", "pharmacist", "clinic")


@router.get("/search", response_model=list[RecordOut])
def search_patient(
    patient_id: str,
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    return record_service.get_records_by_hp_id(patient_id, db)


@router.get("/dashboard")
def get_dashboard(current: User = Depends(_org), db: Session = Depends(get_db)):
    from app.models.user import AuditLog, ConsentRequest, ConsentStatus, MedicalRecord

    consents = db.query(ConsentRequest).filter(ConsentRequest.requester_id == current.id).all()
    uploads = db.query(MedicalRecord).filter(MedicalRecord.provider_id == current.id).all()
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(8)
        .all()
    )
    return {
        "stats": {
            "total_patients": len({r.patient_id for r in uploads} | {c.patient_id for c in consents}),
            "records_uploaded": len(uploads),
            "pending_approval": len([c for c in consents if c.status == ConsentStatus.pending]),
            "approved_requests": len([c for c in consents if c.status == ConsentStatus.approved]),
        },
        "recent_records": [record_service.record_to_out(r) for r in sorted(uploads, key=lambda r: r.created_at, reverse=True)[:5]],
        "recent_consents": [ConsentOut.model_validate(c) for c in sorted(consents, key=lambda c: c.timestamp, reverse=True)[:5]],
        "recent_audit": [AuditOut.model_validate(l) for l in logs],
    }


@router.post("/upload")
def upload_record(
    req: RecordCreate,
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    return record_service.upload_record(req, current, db)


@router.post("/upload-file")
async def upload_file_record(
    patient_hp_id: str = Form(...),
    type: str = Form("lab"),
    file: UploadFile = File(...),
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    processed = process_uploaded_document(file_bytes, file.filename or "upload.bin", file.content_type)
    storage_key = mongo_document_store.save_document(
        data=file_bytes,
        filename=file.filename or "upload.bin",
        content_type=file.content_type,
        patient_hp_id=patient_hp_id,
        provider_id=current.id,
        record_type=type,
        extracted_data=processed.extracted_data,
    )
    result = record_service.upload_processed_record(
        patient_hp_id,
        type,
        processed,
        current,
        db,
        file_name=file.filename,
        file_content_type=file.content_type,
        file_size=len(file_bytes),
        storage_key=storage_key,
    )
    return {
        **result,
        "file_name": file.filename,
        "storage_provider": "mongodb" if storage_key else "database",
        "summary": processed.summary,
        "risk": processed.risk_label,
        "confidence": processed.risk_confidence,
        "structured_data": processed.extracted_data,
    }


@router.post("/modify-request")
def modify_request(
    req: ModifyRequest,
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    from app.models.user import ConsentRequest, ConsentType
    from app.services.record_service import _get_patient_by_hp_id, _log

    patient = _get_patient_by_hp_id(req.patient_hp_id, db)
    consent = ConsentRequest(
        type=ConsentType.modify,
        requester_id=current.id,
        requester_name=current.name,
        organization_type=current.role,
        patient_id=patient.id,
        record_id=req.record_id,
        reason=req.reason,
    )
    db.add(consent)
    _log(db, current, "MODIFY_REQUEST", str(req.record_id), req.reason)
    db.commit()
    return {"message": "Modify request submitted — awaiting patient consent"}


@router.post("/delete-request")
def delete_request(
    req: DeleteRequest,
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    from app.models.user import ConsentRequest, ConsentType
    from app.services.record_service import _get_patient_by_hp_id, _log

    patient = _get_patient_by_hp_id(req.patient_hp_id, db)
    consent = ConsentRequest(
        type=ConsentType.delete,
        requester_id=current.id,
        requester_name=current.name,
        organization_type=current.role,
        patient_id=patient.id,
        record_id=req.record_id,
        reason=req.reason,
    )
    db.add(consent)
    _log(db, current, "DELETE_REQUEST", str(req.record_id), req.reason)
    db.commit()
    return {"message": "Delete request submitted — awaiting patient consent"}


@router.get("/consent-status", response_model=list[ConsentOut])
def consent_status(
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    return consent_service.get_org_consent_status(current.id, db)


@router.get("/audit", response_model=list[AuditOut])
def get_audit(current: User = Depends(_org), db: Session = Depends(get_db)):
    from app.models.user import AuditLog

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(100)
        .all()
    )
    return [AuditOut.model_validate(l) for l in logs]


@router.patch("/profile", response_model=UserOut)
def update_profile(
    req: UserUpdate,
    current: User = Depends(_org),
    db: Session = Depends(get_db),
):
    if req.name is not None:
        current.name = req.name
    if req.email is not None:
        current.email = req.email
    if req.organization is not None:
        current.organization = req.organization
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)
