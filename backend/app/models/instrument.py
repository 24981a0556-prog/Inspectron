import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Float, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class InstrumentStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    ACTIVE = "ACTIVE"
    VERIFICATION_DUE = "VERIFICATION_DUE"
    VERIFIED = "VERIFIED"
    SUSPENDED = "SUSPENDED"
    CONDEMNED = "CONDEMNED"


class InstrumentType(str, enum.Enum):
    ELECTRONIC_WEIGHING = "ELECTRONIC_WEIGHING"
    NON_AUTOMATIC_WEIGHING = "NON_AUTOMATIC_WEIGHING"
    FUEL_DISPENSER = "FUEL_DISPENSER"
    FLOW_METER = "FLOW_METER"


class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    passport_id = Column(String(50), unique=True, index=True, nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    instrument_type = Column(Enum(InstrumentType), default=InstrumentType.ELECTRONIC_WEIGHING, nullable=False)
    manufacturer = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    capacity = Column(Float, nullable=False)
    capacity_unit = Column(String(20), default="kg", nullable=False)
    manufacture_year = Column(Integer, nullable=True)
    purchase_date = Column(String(50), nullable=True)
    location_description = Column(String(500), nullable=True)
    status = Column(Enum(InstrumentStatus), default=InstrumentStatus.REGISTERED, nullable=False)
    current_certificate_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization = relationship("Organization", back_populates="instruments")
    applications = relationship("Application", back_populates="instrument", cascade="all, delete-orphan")
