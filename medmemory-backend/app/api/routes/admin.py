from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role
from app.schemas.schemas import AuditOut, OrgOut, UserOut
from app.services import admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])

_admin = require_role("admin")


@router.get("/users", response_model=list[UserOut])
def list_users(current=Depends(_admin), db: Session = Depends(get_db)):
    return admin_service.list_users(db)


@router.get("/orgs", response_model=list[OrgOut])
def list_orgs(current=Depends(_admin), db: Session = Depends(get_db)):
    return admin_service.list_orgs(db)


@router.get("/audit", response_model=list[AuditOut])
def list_audit(current=Depends(_admin), db: Session = Depends(get_db)):
    return admin_service.list_audit(db)


@router.get("/audit/verify")
def verify_audit_chain(current=Depends(_admin), db: Session = Depends(get_db)):
    return admin_service.verify_audit_chain(db)


@router.get("/security-logs", response_model=list[AuditOut])
def security_logs(current=Depends(_admin), db: Session = Depends(get_db)):
    # Security logs = audit entries flagged as warning or error
    from app.models.user import AuditLog, AuditStatus

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.status.in_([AuditStatus.warning, AuditStatus.error]))
        .order_by(AuditLog.timestamp.desc())
        .limit(100)
        .all()
    )
    return [AuditOut.model_validate(l) for l in logs]
