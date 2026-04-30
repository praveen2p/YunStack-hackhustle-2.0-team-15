from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.dependencies import hash_password
from app.models.user import MedicalRecord, RecordStatus, RecordType, User, UserRole


def seed_demo_data(db: Session) -> None:
    if db.query(User).filter(User.email == "john.doe@email.com").first():
        return

    patient = User(
        email="john.doe@email.com",
        name="John Doe",
        hashed_password=hash_password("password123"),
        role=UserRole.patient,
        hp_id="HP-PAT-DEMO",
    )
    doctor = User(
        email="dr.smith@hospital.com",
        name="Dr. Sarah Smith",
        hashed_password=hash_password("password123"),
        role=UserRole.doctor,
        organization="City General Hospital",
    )
    admin = User(
        email="admin@memora.ai",
        name="Platform Admin",
        hashed_password=hash_password("password123"),
        role=UserRole.admin,
        organization="Memora AI",
    )
    db.add_all([patient, doctor, admin])
    db.flush()

    db.add_all([
        MedicalRecord(
            patient_id=patient.id,
            provider_id=doctor.id,
            provider_name=doctor.name,
            type=RecordType.lab,
            title="Annual Blood Panel",
            content="CBC, lipid panel, and metabolic panel are within expected ranges.",
            status=RecordStatus.active,
            date=datetime(2024, 3, 12, tzinfo=timezone.utc),
        ),
        MedicalRecord(
            patient_id=patient.id,
            provider_id=doctor.id,
            provider_name=doctor.name,
            type=RecordType.prescription,
            title="Lisinopril Prescription",
            content="Lisinopril 10mg once daily. Review blood pressure in 30 days.",
            status=RecordStatus.active,
            date=datetime(2023, 12, 20, tzinfo=timezone.utc),
        ),
    ])
    db.commit()
