import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut


def _generate_hp_id() -> str:
    return f"HP-PAT-{uuid.uuid4().hex[:4].upper()}"


def register(req: RegisterRequest, db: Session) -> TokenResponse:
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hp_id = _generate_hp_id() if req.role == UserRole.patient else None
    user = User(
        email=req.email,
        name=req.name,
        hashed_password=hash_password(req.password),
        role=req.role,
        organization=req.organization,
        hp_id=hp_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


def login(req: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
