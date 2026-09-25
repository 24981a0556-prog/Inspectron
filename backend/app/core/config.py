import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "INSPECTRA"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    
    # 8-hour token expiration as per Architecture Plan v2 Section E
    SECRET_KEY: str = "inspectra-sih-2026-super-secure-jwt-secret-key-32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite:///./inspectra.db"

    # Storage
    STORAGE_DIR: str = "./uploads"
    PUBLIC_URL: str = "http://localhost:5173"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "evidence"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "certificates"), exist_ok=True)
