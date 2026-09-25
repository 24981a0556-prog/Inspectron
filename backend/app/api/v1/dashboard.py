from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.instrument import Instrument, InstrumentStatus
from app.models.application import Application, ApplicationStatus
from app.models.certificate import Certificate, CertificateStatus
from app.models.organization import Organization
from app.schemas.dashboard import (
    BusinessDashboardStats,
    LMODashboardStats,
    AdminDashboardStats,
    StatusCount
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/business", response_model=BusinessDashboardStats)
def get_business_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    total_inst = db.query(Instrument).filter(Instrument.organization_id == org_id).count() if org_id else db.query(Instrument).count()
    active_inst = db.query(Instrument).filter(Instrument.organization_id == org_id, Instrument.status.in_([InstrumentStatus.ACTIVE, InstrumentStatus.VERIFIED])).count() if org_id else 0
    pending_apps = db.query(Application).filter(Application.applicant_id == current_user.id, Application.status.in_([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.ASSIGNED, ApplicationStatus.IN_PROGRESS])).count()
    verified_inst = db.query(Instrument).filter(Instrument.organization_id == org_id, Instrument.status == InstrumentStatus.VERIFIED).count() if org_id else 0

    return BusinessDashboardStats(
        total_instruments=max(total_inst, 1),
        active_instruments=max(active_inst, 1),
        pending_applications=pending_apps,
        verified_instruments=verified_inst,
        is_demo_seed_data=True,
        recent_activity=[
            {"action": "Application Created", "ref": "VER-2026-00128", "time": "2 hours ago"},
            {"action": "Instrument Registered", "ref": "INST-AP-00128", "time": "1 day ago"}
        ]
    )


@router.get("/lmo", response_model=LMODashboardStats)
def get_lmo_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pending_review = db.query(Application).filter(Application.status == ApplicationStatus.SUBMITTED).count()
    active_assignments = db.query(Application).filter(Application.status.in_([ApplicationStatus.ASSIGNED, ApplicationStatus.IN_PROGRESS])).count()
    awaiting_auth = db.query(Application).filter(Application.status == ApplicationStatus.IN_PROGRESS).count()
    certs_issued = db.query(Certificate).count()

    return LMODashboardStats(
        pending_review_count=max(pending_review, 1),
        active_assignments_count=active_assignments,
        awaiting_authorization_count=awaiting_auth,
        certificates_issued_count=certs_issued,
        is_demo_seed_data=True,
        urgent_applications=[
            {"app_no": "VER-2026-00128", "org": "ABC Retail Store", "type": "Initial Verification", "urgency": "High"}
        ]
    )


@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_orgs = db.query(Organization).count()
    total_inst = db.query(Instrument).count()
    total_users = db.query(User).count()
    total_certs = db.query(Certificate).count()

    # Status distribution
    counts = [
        StatusCount(status="VERIFIED", count=db.query(Instrument).filter(Instrument.status == InstrumentStatus.VERIFIED).count()),
        StatusCount(status="ACTIVE", count=db.query(Instrument).filter(Instrument.status == InstrumentStatus.ACTIVE).count()),
        StatusCount(status="REGISTERED", count=db.query(Instrument).filter(Instrument.status == InstrumentStatus.REGISTERED).count()),
        StatusCount(status="VERIFICATION_DUE", count=db.query(Instrument).filter(Instrument.status == InstrumentStatus.VERIFICATION_DUE).count())
    ]

    return AdminDashboardStats(
        total_organizations=max(total_orgs, 1),
        total_instruments=max(total_inst, 1),
        total_users=max(total_users, 4),
        total_certificates=total_certs,
        status_distribution=counts,
        is_demo_seed_data=True
    )
