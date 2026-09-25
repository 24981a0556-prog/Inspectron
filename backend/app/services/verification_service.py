from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.verification import Verification, VerificationStatus
from app.models.assignment import VerificationAssignment, AssignmentStatus
from app.models.application import Application, ApplicationStatus
from app.schemas.verification import VerificationDraftUpdate
from app.services.audit_service import log_action


def start_verification(
    db: Session,
    assignment_id: str,
    officer_id: str,
    actor_role: str = "GATC"
) -> Verification:
    assignment = db.query(VerificationAssignment).filter(VerificationAssignment.id == assignment_id).first()
    if not assignment:
        raise ValueError("Assignment not found")

    # Check if a verification already exists for this assignment
    existing = db.query(Verification).filter(Verification.assignment_id == assignment_id).first()
    if existing:
        return existing

    verification = Verification(
        assignment_id=assignment.id,
        application_id=assignment.application_id,
        officer_id=officer_id,
        status=VerificationStatus.DRAFT,
        checklist_data={},
        measurement_data={}
    )
    db.add(verification)

    # Transition assignment to IN_PROGRESS
    assignment.status = AssignmentStatus.IN_PROGRESS

    # Transition application to IN_PROGRESS
    app = db.query(Application).filter(Application.id == assignment.application_id).first()
    if app and app.status in [ApplicationStatus.ASSIGNED, ApplicationStatus.UNDER_REVIEW]:
        app.status = ApplicationStatus.IN_PROGRESS

    db.commit()
    db.refresh(verification)

    log_action(
        db=db,
        entity_type="VERIFICATION",
        entity_id=verification.id,
        action="VERIFICATION_STARTED",
        actor_id=officer_id,
        actor_role=actor_role,
        details={"assignment_id": assignment_id}
    )
    return verification


def update_draft(
    db: Session,
    verification_id: str,
    data: VerificationDraftUpdate,
    officer_id: Optional[str] = None,
    actor_role: str = "GATC"
) -> Verification:
    verification = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verification:
        raise ValueError("Verification not found")

    if verification.status == VerificationStatus.SUBMITTED:
        raise ValueError("Cannot edit an already submitted verification")

    if data.checklist_data is not None:
        # Merge or update
        merged_checklist = dict(verification.checklist_data or {})
        merged_checklist.update(data.checklist_data)
        verification.checklist_data = merged_checklist

    if data.measurement_data is not None:
        merged_meas = dict(verification.measurement_data or {})
        merged_meas.update(data.measurement_data)
        verification.measurement_data = merged_meas

    if data.officer_remarks is not None:
        verification.officer_remarks = data.officer_remarks

    if data.latitude is not None:
        verification.latitude = data.latitude
    if data.longitude is not None:
        verification.longitude = data.longitude
    if data.latitude is not None or data.longitude is not None:
        verification.location_captured_at = datetime.now(timezone.utc)

    # If already validated but data modified, revert status to DRAFT so officer must validate again
    if verification.status == VerificationStatus.VALIDATED:
        verification.status = VerificationStatus.DRAFT

    db.commit()
    db.refresh(verification)
    return verification


def get_verification(db: Session, verification_id: str) -> Optional[Verification]:
    return db.query(Verification).filter(Verification.id == verification_id).first()


def submit_verification(
    db: Session,
    verification_id: str,
    officer_id: str,
    actor_role: str = "GATC"
) -> Verification:
    verification = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verification:
        raise ValueError("Verification not found")

    if verification.status != VerificationStatus.VALIDATED:
        raise ValueError("Verification must pass rule validation before submission")

    if not verification.rule_validation_result or not verification.rule_validation_result.get("passed"):
        raise ValueError("Cannot submit: rule validation failed with errors")

    verification.status = VerificationStatus.SUBMITTED
    verification.completed_at = datetime.now(timezone.utc)

    # Update Assignment to COMPLETED
    assignment = db.query(VerificationAssignment).filter(VerificationAssignment.id == verification.assignment_id).first()
    if assignment:
        assignment.status = AssignmentStatus.COMPLETED

    db.commit()
    db.refresh(verification)

    log_action(
        db=db,
        entity_type="VERIFICATION",
        entity_id=verification.id,
        action="VERIFICATION_SUBMITTED",
        actor_id=officer_id,
        actor_role=actor_role,
        details={
            "application_id": verification.application_id,
            "validation_passed": True
        }
    )
    return verification
