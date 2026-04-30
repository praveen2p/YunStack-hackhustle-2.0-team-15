from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, org, patient
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine, ensure_schema
from app.core.mongodb import mongo_document_store
from app.services.seed_service import seed_demo_data

# Create all tables on startup
Base.metadata.create_all(bind=engine)
ensure_schema()
with SessionLocal() as db:
    seed_demo_data(db)

app = FastAPI(
    title="MedMemory API",
    description="Backend for HealPath AI — patient-consent-driven medical records",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_origin_regex=r"http://localhost:30[0-9]{2}",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(org.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "mongodb_enabled": mongo_document_store.enabled}


@app.on_event("shutdown")
def shutdown():
    mongo_document_store.close()
