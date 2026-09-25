from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.instrument import InstrumentStatus, InstrumentType
from app.schemas.organization import OrganizationRead


class InstrumentBase(BaseModel):
    instrument_type: InstrumentType = InstrumentType.ELECTRONIC_WEIGHING
    manufacturer: str
    model: str
    serial_number: str
    capacity: float
    capacity_unit: str = "kg"
    manufacture_year: Optional[int] = None
    purchase_date: Optional[str] = None
    location_description: Optional[str] = None


class InstrumentCreate(InstrumentBase):
    organization_id: Optional[str] = None


class InstrumentUpdate(BaseModel):
    location_description: Optional[str] = None
    status: Optional[InstrumentStatus] = None


class InstrumentRead(InstrumentBase):
    id: str
    passport_id: str
    organization_id: str
    status: InstrumentStatus
    current_certificate_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificateBrief(BaseModel):
    id: str
    certificate_number: str
    valid_from: str
    valid_until: str
    status: str
    issued_at: datetime
    qr_token: str
    pdf_storage_path: Optional[str] = None


class ApplicationBrief(BaseModel):
    id: str
    application_number: str
    application_type: str
    status: str
    submitted_at: Optional[datetime] = None
    authorized_at: Optional[datetime] = None
    created_at: datetime


class InstrumentPassportRead(InstrumentRead):
    organization: Optional[OrganizationRead] = None
    current_certificate: Optional[CertificateBrief] = None
    recent_applications: List[ApplicationBrief] = []
    historical_certificates: List[CertificateBrief] = []
