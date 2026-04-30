from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./medmemory.db"
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    GEMINI_API_KEY: str | None = None
    VITE_GEMINI_API_KEY: str | None = None
    AES_256_KEY: str | None = None
    FHIR_DATASET_DIR: str = "/Users/apple/Downloads/csv"
    MONGODB_URI: str | None = None
    MONGODB_DATABASE: str = "medmemory"
    MONGODB_GRIDFS_BUCKET: str = "medical_documents"
    MONGODB_REQUIRED: bool = False

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    @property
    def effective_gemini_api_key(self) -> str | None:
        return self.GEMINI_API_KEY or self.VITE_GEMINI_API_KEY

    @property
    def mongodb_enabled(self) -> bool:
        return bool(self.MONGODB_URI)


settings = Settings()
