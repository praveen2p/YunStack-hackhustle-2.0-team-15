from io import BytesIO
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.mongodb import mongo_document_store
from app.models.user import User
from app.schemas.schemas import AuditOut, ConsentAction, ConsentOut, RecordOut
from app.services import consent_service, record_service
from app.services.ai_insights_service import build_patient_ai_summary, build_patient_risk_analysis
from app.models.user import AuditLog, AuditStatus, ConsentStatus, MedicalRecord
from app.schemas.schemas import UserOut, UserUpdate

router = APIRouter(prefix="/api/patient", tags=["patient"])

_patient = require_role("patient")


@router.get("/records", response_model=list[RecordOut])
def get_records(current: User = Depends(_patient), db: Session = Depends(get_db)):
    return record_service.get_records(current.id, db)


@router.get("/summary-insights")
def get_summary_insights(current: User = Depends(_patient), db: Session = Depends(get_db)):
    return build_patient_ai_summary(current, db)


@router.get("/risk-analysis")
def get_risk_analysis(current: User = Depends(_patient), db: Session = Depends(get_db)):
    return build_patient_risk_analysis(current, db)


@router.get("/records/{record_id}/file")
def download_record_file(
    record_id: int,
    current: User = Depends(_patient),
    db: Session = Depends(get_db),
):
    record = db.get(MedicalRecord, record_id)
    if not record or record.patient_id != current.id:
        raise HTTPException(status_code=404, detail="Record not found")
    if not record.storage_key:
        raise HTTPException(status_code=404, detail="No stored file is attached to this record")

    data, filename, content_type = mongo_document_store.get_document(record.storage_key)
    quoted_filename = quote(filename or f"record-{record_id}")
    return StreamingResponse(
        BytesIO(data),
        media_type=content_type or "application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quoted_filename}"},
    )


@router.get("/dashboard")
def get_dashboard(current: User = Depends(_patient), db: Session = Depends(get_db)):
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == current.id).all()
    consents = consent_service.get_patient_consent(current.id, db)
    audits = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(5)
        .all()
    )
    pending = [c for c in consents if c.status == ConsentStatus.pending]
    active_records = [r for r in records if r.status.value == "active"]
    return {
        "stats": {
            "total_records": len(records),
            "pending_consents": len(pending),
            "active_access": len({c.requester_id for c in consents if c.status == ConsentStatus.approved}),
            "health_score": min(99, 70 + len(active_records) * 4),
        },
        "recent_records": [record_service.record_to_out(r) for r in sorted(records, key=lambda r: r.date, reverse=True)[:4]],
        "pending_consents": pending[:3],
        "recent_audit": [AuditOut.model_validate(a) for a in audits],
    }


@router.get("/consent", response_model=list[ConsentOut])
def get_consent(current: User = Depends(_patient), db: Session = Depends(get_db)):
    return consent_service.get_patient_consent(current.id, db)


@router.patch("/consent/{consent_id}", response_model=ConsentOut)
def action_consent(
    consent_id: int,
    action: ConsentAction,
    current: User = Depends(_patient),
    db: Session = Depends(get_db),
):
    return consent_service.action_consent(consent_id, action, current, db)


@router.get("/audit", response_model=list[AuditOut])
def get_audit(current: User = Depends(_patient), db: Session = Depends(get_db)):
    from app.schemas.schemas import AuditOut
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(50)
        .all()
    )
    return [AuditOut.model_validate(l) for l in logs]


@router.get("/notifications")
def get_notifications(current: User = Depends(_patient), db: Session = Depends(get_db)):
    consents = (
        db.query(consent_service.ConsentRequest)
        .filter(consent_service.ConsentRequest.patient_id == current.id)
        .order_by(consent_service.ConsentRequest.timestamp.desc())
        .limit(20)
        .all()
    )
    audits = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(5)
        .all()
    )
    notifications = [
        {
            "id": f"consent-{item.id}",
            "type": item.type,
            "title": f"{item.type.value.title()} consent {item.status.value}",
            "description": item.reason,
            "timestamp": item.timestamp,
            "unread": item.status == ConsentStatus.pending,
            "path": "/patient/consent",
        }
        for item in consents
    ]
    notifications.extend([
        {
            "id": f"audit-{item.id}",
            "type": "security",
            "title": item.action.replace("_", " ").title(),
            "description": item.details,
            "timestamp": item.timestamp,
            "unread": False,
            "path": "/patient/audit",
        }
        for item in audits
    ])
    return sorted(notifications, key=lambda item: item["timestamp"], reverse=True)


@router.get("/timeline", response_model=list[RecordOut])
def get_timeline(current: User = Depends(_patient), db: Session = Depends(get_db)):
    return [
        record_service.record_to_out(r)
        for r in db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == current.id)
        .order_by(MedicalRecord.date.desc())
        .all()
    ]


@router.patch("/profile", response_model=UserOut)
def update_profile(
    req: UserUpdate,
    current: User = Depends(_patient),
    db: Session = Depends(get_db),
):
    if req.name is not None:
        current.name = req.name
    if req.email is not None:
        current.email = req.email
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)
