from sqlalchemy.orm import Session

from app.models.user import AuditLog, User, UserRole, _audit_hash_payload
from app.schemas.schemas import AuditOut, OrgOut, UserOut


def list_users(db: Session) -> list[UserOut]:
    return [UserOut.model_validate(u) for u in db.query(User).all()]


def list_orgs(db: Session) -> list[OrgOut]:
    org_roles = {UserRole.doctor, UserRole.lab, UserRole.pharmacist, UserRole.clinic}
    users = db.query(User).filter(User.role.in_(org_roles)).all()
    return [OrgOut.model_validate(u) for u in users]


def list_audit(db: Session, limit: int = 100) -> list[AuditOut]:
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [AuditOut.model_validate(l) for l in logs]


def verify_audit_chain(db: Session) -> dict:
    import hashlib

    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    previous_hash = None
    verified = 0
    legacy_unhashed = 0
    for log in logs:
        if not log.entry_hash:
            legacy_unhashed += 1
            continue
        if log.previous_hash != previous_hash:
            return {"valid": False, "verified_entries": verified, "broken_at": log.id, "reason": "previous hash mismatch"}
        expected = hashlib.sha256(_audit_hash_payload(log, previous_hash).encode("utf-8")).hexdigest()
        if log.entry_hash != expected:
            return {"valid": False, "verified_entries": verified, "broken_at": log.id, "reason": "entry hash mismatch"}
        previous_hash = log.entry_hash
        verified += 1
    return {"valid": True, "verified_entries": verified, "legacy_unhashed_entries": legacy_unhashed, "head_hash": previous_hash}
