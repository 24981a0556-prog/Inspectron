import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class AssignmentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class VerificationAssignment(Base):
    __tablename__ = "verification_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    assigned_officer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    scheduled_date = Column(String(50), nullable=False)
    scheduled_time_slot = Column(String(50), nullable=True)
    location_note = Column(Text, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.SCHEDULED, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="assignments")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    verifications = relationship("Verification", back_populates="assignment", cascade="all, delete-orphan")
