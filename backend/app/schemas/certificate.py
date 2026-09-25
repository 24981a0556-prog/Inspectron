from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.certificate import CertificateStatus


class CertificateGenerateRequest(BaseModel):
    application_id: str


class CertificateRead(BaseModel):
    id: str
    certificate_number: str
    application_id: str
    instrument_id: str
    verification_id: str
    issued_by_id: Optional[str] = None
    issued_at: datetime
    valid_from: str
    valid_until: str
    status: CertificateStatus
    qr_token: str
    pdf_storage_path: Optional[str] = None
    pdf_url: Optional[str] = None
    certificate_data: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class PublicInstrumentSummary(BaseModel):
    manufacturer: str
    model: str
    serial_number: str
    capacity: float
    capacity_unit: str
    instrument_type: str
    location_description: Optional[str] = None


class PublicOwnerSummary(BaseModel):
    name: str
    city: Optional[str] = None
    state: Optional[str] = None


class PublicCertificateVerification(BaseModel):
    valid: bool
    certificate_number: str
    status: str
    instrument: PublicInstrumentSummary
    owner: PublicOwnerSummary
    issued_at: str
    valid_from: str
    valid_until: str
    issued_by: str
    qr_token: str
    verification_url: str
    disclaimer: str = "This is a prototype demonstration certificate and does not constitute a statutory legal metrology document."
