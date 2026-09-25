import io
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import qrcode
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from sqlalchemy.orm import Session

from app.models.certificate import Certificate, CertificateStatus
from app.models.application import Application, ApplicationStatus
from app.models.verification import Verification, VerificationStatus
from app.models.instrument import Instrument, InstrumentStatus
from app.models.organization import Organization
from app.models.user import User
from app.core.config import settings
from app.storage import storage_backend
from app.services.audit_service import log_action


def generate_qr_image_bytes(verification_url: str) -> bytes:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a0f1e", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()


def build_certificate_pdf(
    certificate_number: str,
    qr_token: str,
    instrument: Instrument,
    organization: Optional[Organization],
    issued_by_name: str,
    valid_from: str,
    valid_until: str,
    verification_url: str
) -> bytes:
    """
    Renders an enterprise GovTech Digital Verification Certificate PDF.
    """
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        alignment=1,
        textColor=colors.HexColor("#0a0f1e")
    )
    subtitle_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#2563eb")
    )
    cert_no_style = ParagraphStyle(
        'CertNo',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#1e293b")
    )
    disclaimer_style = ParagraphStyle(
        'CertDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#64748b")
    )

    story = []

    # Header
    story.append(Paragraph("GOVERNMENT OF LEGAL METROLOGY (DEMO)", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("DIGITAL CERTIFICATE OF VERIFICATION", title_style))
    story.append(Paragraph("WEIGHTS AND MEASURES (STANDARDS) COMPLIANCE", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>CERTIFICATE ID:</b> {certificate_number}", cert_no_style))
    story.append(Spacer(1, 16))

    # Details Table
    org_name = organization.name if organization else "ABC Retail Store"
    org_loc = f"{organization.city}, {organization.state}" if organization and organization.city else "Visakhapatnam, Andhra Pradesh"

    data = [
        [Paragraph("<b>Instrument Model</b>", styles['Normal']), Paragraph(f"{instrument.manufacturer} {instrument.model}", styles['Normal'])],
        [Paragraph("<b>Digital Passport ID</b>", styles['Normal']), Paragraph(f"<b>{instrument.passport_id}</b>", styles['Normal'])],
        [Paragraph("<b>Serial Number</b>", styles['Normal']), Paragraph(instrument.serial_number, styles['Normal'])],
        [Paragraph("<b>Category / Type</b>", styles['Normal']), Paragraph(instrument.instrument_type.value.replace("_", " ").title(), styles['Normal'])],
        [Paragraph("<b>Verified Capacity</b>", styles['Normal']), Paragraph(f"{instrument.capacity} {instrument.capacity_unit}", styles['Normal'])],
        [Paragraph("<b>Instrument Owner / Org</b>", styles['Normal']), Paragraph(f"{org_name} ({org_loc})", styles['Normal'])],
        [Paragraph("<b>Authorized Verification Officer</b>", styles['Normal']), Paragraph(issued_by_name, styles['Normal'])],
        [Paragraph("<b>Verification Date</b>", styles['Normal']), Paragraph(valid_from, styles['Normal'])],
        [Paragraph("<b>Validity Expiry Date</b>", styles['Normal']), Paragraph(f"<b>{valid_until}</b>", styles['Normal'])],
        [Paragraph("<b>Regulatory Status</b>", styles['Normal']), Paragraph("<b>VERIFIED & COMPLIANT</b>", styles['Normal'])]
    ]

    t = Table(data, colWidths=[200, 340])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))

    # QR Code generation
    qr_png_bytes = generate_qr_image_bytes(verification_url)
    qr_img = RLImage(io.BytesIO(qr_png_bytes), width=110, height=110)

    qr_text = f"""
    <b>SECURE DIGITAL VERIFICATION</b><br/>
    Scan this QR code with any mobile device or camera to verify certificate authenticity in real time.<br/><br/>
    <b>Direct Verification Link:</b><br/>
    <font color="#2563eb">{verification_url}</font><br/><br/>
    <b>Cryptographic QR Token:</b><br/>
    <font face="Courier" size="7">{qr_token}</font>
    """
    qr_para = Paragraph(qr_text, styles['Normal'])

    qr_table = Table([[qr_img, qr_para]], colWidths=[130, 410])
    qr_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('PADDING', (0, 0), (-1, -1), 10)
    ]))
    story.append(qr_table)
    story.append(Spacer(1, 18))

    # Statutory disclaimer
    disclaimer_text = (
        "<b>DISCLAIMER:</b> This digital verification certificate is generated by INSPECTRA for Smart India Hackathon "
        "SIH-26036 prototype demonstration purposes. It demonstrates evidence-backed digital verification, "
        "configurable regulatory rule evaluation, and QR-enabled public verification."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()


def generate_certificate(
    db: Session,
    application_id: str,
    issued_by_id: Optional[str] = None,
    actor_role: str = "LMO"
) -> Certificate:
    """
    Generates Certificate strictly after Authorized Decision (Correction 5).
    Preconditions:
    1. Application.status == APPROVED
    2. Verification.status == SUBMITTED
    3. No duplicate certificate for this application
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError("Application not found")

    # Hard gate 1: Application must be APPROVED
    if app.status != ApplicationStatus.APPROVED:
        raise ValueError("Cannot issue certificate: Application has not received Authorized Approval (status must be APPROVED)")

    # Hard gate 2: Verification must be SUBMITTED
    verification = db.query(Verification).filter(Verification.application_id == application_id).order_by(Verification.created_at.desc()).first()
    if not verification or verification.status != VerificationStatus.SUBMITTED:
        raise ValueError("Cannot issue certificate: Field verification has not been completed and submitted")

    # Hard gate 3: Duplicate check
    existing_cert = db.query(Certificate).filter(Certificate.application_id == application_id).first()
    if existing_cert:
        return existing_cert

    instrument = db.query(Instrument).filter(Instrument.id == app.instrument_id).first()
    if not instrument:
        raise ValueError("Instrument not found")

    organization = db.query(Organization).filter(Organization.id == instrument.organization_id).first()
    officer_user = db.query(User).filter(User.id == issued_by_id).first() if issued_by_id else None
    officer_name = officer_user.full_name if officer_user else "Rajesh Kumar (LMO)"

    # Format numbers and dates
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=365)
    valid_from_str = now.strftime("%Y-%m-%d")
    valid_until_str = expiry.strftime("%Y-%m-%d")

    # Certificate ID e.g. LM-2026-00128
    cert_suffix = uuid.uuid4().hex[:5].upper()
    certificate_number = f"LM-2026-{cert_suffix}"
    qr_token = str(uuid.uuid4())

    verification_url = f"{settings.PUBLIC_URL}/verify/{qr_token}"

    # Generate PDF bytes
    pdf_bytes = build_certificate_pdf(
        certificate_number=certificate_number,
        qr_token=qr_token,
        instrument=instrument,
        organization=organization,
        issued_by_name=officer_name,
        valid_from=valid_from_str,
        valid_until=valid_until_str,
        verification_url=verification_url
    )

    # Save PDF in StorageBackend
    dest_path = f"certificates/{certificate_number}.pdf"
    stored_pdf_path = storage_backend.save(pdf_bytes, dest_path)

    # Snapshot data
    snapshot_data = {
        "certificate_number": certificate_number,
        "instrument": {
            "id": instrument.id,
            "passport_id": instrument.passport_id,
            "manufacturer": instrument.manufacturer,
            "model": instrument.model,
            "serial_number": instrument.serial_number,
            "capacity": instrument.capacity,
            "capacity_unit": instrument.capacity_unit,
            "type": instrument.instrument_type.value
        },
        "organization": {
            "name": organization.name if organization else None,
            "city": organization.city if organization else None,
            "state": organization.state if organization else None
        },
        "verified_by": officer_name,
        "valid_from": valid_from_str,
        "valid_until": valid_until_str,
        "verification_url": verification_url,
        "qr_token": qr_token
    }

    # Save Certificate to DB
    cert = Certificate(
        certificate_number=certificate_number,
        application_id=app.id,
        instrument_id=instrument.id,
        verification_id=verification.id,
        issued_by_id=issued_by_id,
        issued_at=now,
        valid_from=valid_from_str,
        valid_until=valid_until_str,
        status=CertificateStatus.ACTIVE,
        qr_token=qr_token,
        pdf_storage_path=stored_pdf_path,
        certificate_data=snapshot_data
    )
    db.add(cert)

    # Transition Instrument status to VERIFIED
    instrument.status = InstrumentStatus.VERIFIED
    instrument.current_certificate_id = cert.id

    db.commit()
    db.refresh(cert)

    log_action(
        db=db,
        entity_type="CERTIFICATE",
        entity_id=cert.id,
        action="CERTIFICATE_ISSUED",
        actor_id=issued_by_id,
        actor_role=actor_role,
        details={
            "certificate_number": certificate_number,
            "instrument_id": instrument.id,
            "passport_id": instrument.passport_id,
            "qr_token": qr_token
        }
    )
    return cert


def get_certificate_by_qr_token(db: Session, qr_token: str) -> Optional[Certificate]:
    return db.query(Certificate).filter(Certificate.qr_token == qr_token).first()


def get_certificate(db: Session, cert_id: str) -> Optional[Certificate]:
    return db.query(Certificate).filter(Certificate.id == cert_id).first()
