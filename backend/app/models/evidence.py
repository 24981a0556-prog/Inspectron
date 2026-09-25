import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class FileType(str, enum.Enum):
    IMAGE = "IMAGE"
    PDF = "PDF"
    VIDEO = "VIDEO"


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    verification_id = Column(String(36), ForeignKey("verifications.id", ondelete="CASCADE"), nullable=False)
    
    # Metadata only - file bytes are in StorageBackend
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    mime_type = Column(String(100), nullable=False)
    file_type = Column(Enum(FileType), default=FileType.IMAGE, nullable=False)
    description = Column(String(500), nullable=True)
    
    captured_at = Column(DateTime, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    verification = relationship("Verification", back_populates="evidence")
    uploader = relationship("User", foreign_keys=[uploader_id])
