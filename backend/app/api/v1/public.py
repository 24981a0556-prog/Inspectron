from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.certificate import Certificate, CertificateStatus
from app.models.instrument import Instrument
from app.models.organization import Organization
from app.models.user import User
from app.schemas.certificate import (
    PublicCertificateVerification,
    PublicInstrumentSummary,
    PublicOwnerSummary
)
from app.core.config import settings

router = APIRouter()


@router.get("/verify/{qr_token}", response_model=PublicCertificateVerification)
def verify_certificate_public(
    qr_token: str,
    db: Session = Depends(get_db)
):
    """
    Public QR Verification Endpoint (NO AUTH REQUIRED).
    Resolves real DB certificate record by unique cryptographic QR token.
    """
    cert = db.query(Certificate).filter(Certificate.qr_token == qr_token).first()
    if not cert:
        raise HTTPException(
            status_code=404,
            detail="Certificate with this QR token could not be verified. It may be invalid or expired."
        )

    instrument = db.query(Instrument).filter(Instrument.id == cert.instrument_id).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Associated instrument record missing")

    organization = db.query(Organization).filter(Organization.id == instrument.organization_id).first()
    issued_by = db.query(User).filter(User.id == cert.issued_by_id).first()

    return PublicCertificateVerification(
        valid=(cert.status == CertificateStatus.ACTIVE),
        certificate_number=cert.certificate_number,
        status=cert.status.value,
        instrument=PublicInstrumentSummary(
            manufacturer=instrument.manufacturer,
            model=instrument.model,
            serial_number=instrument.serial_number,
            capacity=instrument.capacity,
            capacity_unit=instrument.capacity_unit,
            instrument_type=instrument.instrument_type.value,
            location_description=instrument.location_description
        ),
        owner=PublicOwnerSummary(
            name=organization.name if organization else "ABC Retail Store",
            city=organization.city if organization else "Visakhapatnam",
            state=organization.state if organization else "Andhra Pradesh"
        ),
        issued_at=cert.issued_at.strftime("%Y-%m-%d"),
        valid_from=cert.valid_from,
        valid_until=cert.valid_until,
        issued_by=issued_by.full_name if issued_by else "Rajesh Kumar (LMO)",
        qr_token=cert.qr_token,
        verification_url=f"{settings.PUBLIC_URL}/verify/{cert.qr_token}",
        disclaimer="This is a prototype demonstration certificate and does not constitute a statutory legal metrology document."
    )
