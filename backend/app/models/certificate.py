import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class CertificateStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    certificate_number = Column(String(100), unique=True, index=True, nullable=False)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    instrument_id = Column(String(36), ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False)
    verification_id = Column(String(36), ForeignKey("verifications.id", ondelete="CASCADE"), nullable=False)
    issued_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_from = Column(String(50), nullable=False)
    valid_until = Column(String(50), nullable=False)
    status = Column(Enum(CertificateStatus), default=CertificateStatus.ACTIVE, nullable=False)
    
    qr_token = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    pdf_storage_path = Column(String(500), nullable=True)
    certificate_data = Column(JSON, default=dict, nullable=False)

    application = relationship("Application", back_populates="certificates")
    instrument = relationship("Instrument")
    verification = relationship("Verification", back_populates="certificates")
    issued_by = relationship("User", foreign_keys=[issued_by_id])
