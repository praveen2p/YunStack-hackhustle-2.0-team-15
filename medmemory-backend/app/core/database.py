from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Keep existing local SQLite databases compatible with lightweight model changes."""
    inspector = inspect(engine)
    if "medical_records" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("medical_records")}
    optional_columns = {
        "file_name": "VARCHAR(500)",
        "file_content_type": "VARCHAR(255)",
        "file_size": "INTEGER",
        "storage_provider": "VARCHAR(50)",
        "storage_key": "VARCHAR(255)",
    }

    with engine.begin() as connection:
        for name, ddl_type in optional_columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE medical_records ADD COLUMN {name} {ddl_type}"))

    if "audit_logs" not in inspector.get_table_names():
        return

    existing_audit = {column["name"] for column in inspector.get_columns("audit_logs")}
    audit_columns = {
        "previous_hash": "VARCHAR(64)",
        "entry_hash": "VARCHAR(64)",
    }

    with engine.begin() as connection:
        for name, ddl_type in audit_columns.items():
            if name not in existing_audit:
                connection.execute(text(f"ALTER TABLE audit_logs ADD COLUMN {name} {ddl_type}"))
