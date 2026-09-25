import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.instrument import Instrument, InstrumentStatus, InstrumentType
from app.models.organization import Organization
from app.models.certificate import Certificate, CertificateStatus
from app.models.application import Application
from app.schemas.instrument import InstrumentCreate, InstrumentPassportRead, InstrumentRead, CertificateBrief, ApplicationBrief
from app.schemas.organization import OrganizationRead
from app.services.audit_service import log_action


def generate_passport_id(manufacturer: str, serial: str) -> str:
    # Deterministic clean passport identifier, e.g. INST-AP-00128
    prefix = "".join([c for c in manufacturer[:2].upper() if c.isalnum()]) or "IN"
    suffix = serial.split("-")[-1] if "-" in serial else serial[-5:]
    return f"INST-{prefix}-{suffix}"


def create_instrument(
    db: Session,
    data: InstrumentCreate,
    organization_id: str,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None
) -> Instrument:
    passport_id = generate_passport_id(data.manufacturer, data.serial_number)
    
    # Check if serial or passport already exists
    existing = db.query(Instrument).filter(
        (Instrument.serial_number == data.serial_number) | 
        (Instrument.passport_id == passport_id)
    ).first()
    if existing:
        passport_id = f"INST-{uuid.uuid4().hex[:6].upper()}"

    instrument = Instrument(
        passport_id=passport_id,
        organization_id=organization_id,
        instrument_type=data.instrument_type,
        manufacturer=data.manufacturer,
        model=data.model,
        serial_number=data.serial_number,
        capacity=data.capacity,
        capacity_unit=data.capacity_unit,
        manufacture_year=data.manufacture_year,
        purchase_date=data.purchase_date,
        location_description=data.location_description,
        status=InstrumentStatus.REGISTERED
    )
    db.add(instrument)
    db.commit()
    db.refresh(instrument)

    log_action(
        db=db,
        entity_type="INSTRUMENT",
        entity_id=instrument.id,
        action="INSTRUMENT_REGISTERED",
        actor_id=actor_id,
        actor_role=actor_role,
        details={
            "passport_id": instrument.passport_id,
            "serial_number": instrument.serial_number,
            "model": instrument.model
        }
    )
    return instrument


def get_instrument(db: Session, instrument_id: str) -> Optional[Instrument]:
    return db.query(Instrument).filter(Instrument.id == instrument_id).first()


def list_instruments(db: Session, organization_id: Optional[str] = None) -> List[Instrument]:
    query = db.query(Instrument)
    if organization_id:
        query = query.filter(Instrument.organization_id == organization_id)
    return query.order_by(Instrument.created_at.desc()).all()


def get_passport(db: Session, instrument_id: str) -> Optional[Dict[str, Any]]:
    instrument = db.query(Instrument).filter(
        (Instrument.id == instrument_id) | (Instrument.passport_id == instrument_id)
    ).first()
    if not instrument:
        return None

    # Load Organization
    org = db.query(Organization).filter(Organization.id == instrument.organization_id).first()

    # Load Active Certificate
    current_cert = None
    if instrument.current_certificate_id:
        c = db.query(Certificate).filter(Certificate.id == instrument.current_certificate_id).first()
        if c:
            current_cert = {
                "id": c.id,
                "certificate_number": c.certificate_number,
                "valid_from": c.valid_from,
                "valid_until": c.valid_until,
                "status": c.status.value,
                "issued_at": c.issued_at,
                "qr_token": c.qr_token,
                "pdf_storage_path": c.pdf_storage_path
            }

    # Load All Certificates
    all_certs = db.query(Certificate).filter(Certificate.instrument_id == instrument.id).order_by(Certificate.issued_at.desc()).all()
    historical_certificates = [
        {
            "id": c.id,
            "certificate_number": c.certificate_number,
            "valid_from": c.valid_from,
            "valid_until": c.valid_until,
            "status": c.status.value,
            "issued_at": c.issued_at,
            "qr_token": c.qr_token,
            "pdf_storage_path": c.pdf_storage_path
        }
        for c in all_certs
    ]

    # Load Applications
    apps = db.query(Application).filter(Application.instrument_id == instrument.id).order_by(Application.created_at.desc()).all()
    recent_applications = [
        {
            "id": a.id,
            "application_number": a.application_number,
            "application_type": a.application_type.value,
            "status": a.status.value,
            "submitted_at": a.submitted_at,
            "authorized_at": a.authorized_at,
            "created_at": a.created_at
        }
        for a in apps
    ]

    return {
        "id": instrument.id,
        "passport_id": instrument.passport_id,
        "organization_id": instrument.organization_id,
        "instrument_type": instrument.instrument_type.value,
        "manufacturer": instrument.manufacturer,
        "model": instrument.model,
        "serial_number": instrument.serial_number,
        "capacity": instrument.capacity,
        "capacity_unit": instrument.capacity_unit,
        "manufacture_year": instrument.manufacture_year,
        "purchase_date": instrument.purchase_date,
        "location_description": instrument.location_description,
        "status": instrument.status.value,
        "current_certificate_id": instrument.current_certificate_id,
        "created_at": instrument.created_at,
        "updated_at": instrument.updated_at,
        "organization": {
            "id": org.id,
            "name": org.name,
            "address": org.address,
            "city": org.city,
            "state": org.state,
            "gstin": org.gstin,
            "contact_email": org.contact_email,
            "created_at": org.created_at
        } if org else None,
        "current_certificate": current_cert,
        "historical_certificates": historical_certificates,
        "recent_applications": recent_applications
    }
