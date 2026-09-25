import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    verification_id = Column(String(36), ForeignKey("verifications.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value = Column(String(255), nullable=True)
    unit = Column(String(50), nullable=True)
    passed = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    verification = relationship("Verification", back_populates="observations")
