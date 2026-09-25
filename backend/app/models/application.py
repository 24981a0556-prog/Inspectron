import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ApplicationType(str, enum.Enum):
    INITIAL = "INITIAL"
    RENEWAL = "RENEWAL"
    COMPLAINT = "COMPLAINT"


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    instrument_id = Column(String(36), ForeignKey("instruments.id", ondelete="CASCADE"), nullable=False)
    applicant_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_type = Column(Enum(ApplicationType), default=ApplicationType.INITIAL, nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False)
    purpose = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Authorized Decision (Correction 5)
    authorized_at = Column(DateTime, nullable=True)
    authorized_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    instrument = relationship("Instrument", back_populates="applications")
    applicant = relationship("User", foreign_keys=[applicant_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    authorized_by = relationship("User", foreign_keys=[authorized_by_id])
    assignments = relationship("VerificationAssignment", back_populates="application", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="application", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="application", cascade="all, delete-orphan")
