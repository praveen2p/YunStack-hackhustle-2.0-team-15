from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import (
    AuditStatus,
    ConsentStatus,
    ConsentType,
    RecordStatus,
    RecordType,
    UserRole,
)


# ---------- Auth ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole
    organization: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- User ----------

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    hp_id: str | None
    organization: str | None
    avatar: str | None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    organization: str | None = None


# ---------- Medical Records ----------

class RecordCreate(BaseModel):
    patient_hp_id: str
    type: RecordType
    title: str
    content: str
    date: datetime


class RecordOut(BaseModel):
    id: int
    patient_id: int
    provider_id: int
    provider_name: str
    type: RecordType
    title: str
    content: str
    file_name: str | None = None
    file_content_type: str | None = None
    file_size: int | None = None
    storage_provider: str | None = None
    storage_key: str | None = None
    status: RecordStatus
    date: datetime

    model_config = {"from_attributes": True}


# ---------- Consent ----------

class ConsentAction(BaseModel):
    status: ConsentStatus  # approved | rejected


class ConsentOut(BaseModel):
    id: int
    type: ConsentType
    requester_id: int
    requester_name: str
    organization_type: str
    patient_id: int
    record_id: int | None
    reason: str
    status: ConsentStatus
    timestamp: datetime

    model_config = {"from_attributes": True}


class ModifyRequest(BaseModel):
    patient_hp_id: str
    record_id: int
    reason: str


class DeleteRequest(BaseModel):
    patient_hp_id: str
    record_id: int
    reason: str


# ---------- Audit ----------

class AuditOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    action: str
    resource_id: str | None
    details: str
    previous_hash: str | None = None
    entry_hash: str | None = None
    status: AuditStatus
    timestamp: datetime

    model_config = {"from_attributes": True}


# ---------- Admin ----------

class OrgOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    organization: str | None

    model_config = {"from_attributes": True}
