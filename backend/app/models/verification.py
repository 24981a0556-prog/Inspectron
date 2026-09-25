import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    VALIDATED = "VALIDATED"
    SUBMITTED = "SUBMITTED"


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id = Column(String(36), ForeignKey("verification_assignments.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    
    # Location capture
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_captured_at = Column(DateTime, nullable=True)
    
    # Structured field data
    checklist_data = Column(JSON, default=dict, nullable=False)
    measurement_data = Column(JSON, default=dict, nullable=False)
    officer_remarks = Column(Text, nullable=True)
    
    # Rule engine execution snapshot (Correction 4)
    rule_validation_result = Column(JSON, nullable=True)
    rule_validated_at = Column(DateTime, nullable=True)
    
    status = Column(Enum(VerificationStatus), default=VerificationStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assignment = relationship("VerificationAssignment", back_populates="verifications")
    application = relationship("Application", back_populates="verifications")
    officer = relationship("User", foreign_keys=[officer_id])
    observations = relationship("Observation", back_populates="verification", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="verification", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="verification")
