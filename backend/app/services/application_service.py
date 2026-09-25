import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.application import Application, ApplicationStatus, ApplicationType
from app.models.instrument import Instrument
from app.schemas.application import ApplicationCreate
from app.services.audit_service import log_action


def generate_application_number() -> str:
    # E.g. VER-2026-00128 or timestamp-based sequence
    return f"VER-2026-{uuid.uuid4().hex[:5].upper()}"


def create_application(
    db: Session,
    data: ApplicationCreate,
    applicant_id: str,
    actor_role: Optional[str] = "BUSINESS_USER"
) -> Application:
    app_number = generate_application_number()
    application = Application(
        application_number=app_number,
        instrument_id=data.instrument_id,
        applicant_id=applicant_id,
        application_type=data.application_type,
        status=ApplicationStatus.DRAFT,
        purpose=data.purpose,
        notes=data.notes
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    log_action(
        db=db,
        entity_type="APPLICATION",
        entity_id=application.id,
        action="APPLICATION_CREATED",
        actor_id=applicant_id,
        actor_role=actor_role,
        details={"application_number": application.application_number}
    )
    return application


def submit_application(
    db: Session,
    application_id: str,
    actor_id: str,
    actor_role: str
) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError("Application not found")

    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)

    log_action(
        db=db,
        entity_type="APPLICATION",
        entity_id=app.id,
        action="APPLICATION_SUBMITTED",
        actor_id=actor_id,
        actor_role=actor_role,
        details={"application_number": app.application_number, "status": app.status.value}
    )
    return app


def review_application(
    db: Session,
    application_id: str,
    reviewer_id: str,
    notes: Optional[str] = None,
    actor_role: str = "LMO"
) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError("Application not found")

    app.status = ApplicationStatus.UNDER_REVIEW
    app.reviewed_at = datetime.now(timezone.utc)
    app.reviewed_by_id = reviewer_id
    if notes:
        app.notes = (app.notes or "") + f"\n[LMO Review]: {notes}"
    db.commit()
    db.refresh(app)

    log_action(
        db=db,
        entity_type="APPLICATION",
        entity_id=app.id,
        action="APPLICATION_UNDER_REVIEW",
        actor_id=reviewer_id,
        actor_role=actor_role,
        details={"application_number": app.application_number, "status": app.status.value}
    )
    return app


def reject_application(
    db: Session,
    application_id: str,
    reviewer_id: str,
    reason: str,
    actor_role: str = "LMO"
) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError("Application not found")

    app.status = ApplicationStatus.REJECTED
    app.notes = (app.notes or "") + f"\n[Rejected]: {reason}"
    db.commit()
    db.refresh(app)

    log_action(
        db=db,
        entity_type="APPLICATION",
        entity_id=app.id,
        action="APPLICATION_REJECTED",
        actor_id=reviewer_id,
        actor_role=actor_role,
        details={"reason": reason}
    )
    return app


def authorize_application(
    db: Session,
    application_id: str,
    authorizer_id: str,
    decision: str = "APPROVED",
    remarks: Optional[str] = None,
    actor_role: str = "LMO"
) -> Application:
    """
    Authorized Decision step (Correction 5).
    Application must be in progress or under review with submitted verification.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError("Application not found")

    if decision.upper() == "APPROVED":
        app.status = ApplicationStatus.APPROVED
    else:
        app.status = ApplicationStatus.REJECTED

    app.authorized_at = datetime.now(timezone.utc)
    app.authorized_by_id = authorizer_id
    if remarks:
        app.notes = (app.notes or "") + f"\n[Authorized Decision]: {remarks}"

    db.commit()
    db.refresh(app)

    log_action(
        db=db,
        entity_type="APPLICATION",
        entity_id=app.id,
        action=f"APPLICATION_AUTHORIZED_{decision.upper()}",
        actor_id=authorizer_id,
        actor_role=actor_role,
        details={"decision": decision, "remarks": remarks}
    )
    return app


def get_application(db: Session, application_id: str) -> Optional[Application]:
    return db.query(Application).filter(Application.id == application_id).first()


def list_applications(
    db: Session,
    applicant_id: Optional[str] = None,
    status: Optional[ApplicationStatus] = None
) -> List[Application]:
    query = db.query(Application)
    if applicant_id:
        query = query.filter(Application.applicant_id == applicant_id)
    if status:
        query = query.filter(Application.status == status)
    return query.order_by(Application.created_at.desc()).all()
