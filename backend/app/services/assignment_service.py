from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.assignment import VerificationAssignment, AssignmentStatus
from app.models.application import Application, ApplicationStatus
from app.schemas.assignment import AssignmentCreate
from app.services.audit_service import log_action


def create_assignment(
    db: Session,
    data: AssignmentCreate,
    assigned_by_id: str,
    actor_role: str = "LMO"
) -> VerificationAssignment:
    app = db.query(Application).filter(Application.id == data.application_id).first()
    if not app:
        raise ValueError("Application not found")

    assignment = VerificationAssignment(
        application_id=data.application_id,
        assigned_officer_id=data.assigned_officer_id,
        assigned_by_id=assigned_by_id,
        scheduled_date=data.scheduled_date,
        scheduled_time_slot=data.scheduled_time_slot,
        location_note=data.location_note,
        status=AssignmentStatus.SCHEDULED
    )
    db.add(assignment)

    # Transition application status to ASSIGNED
    app.status = ApplicationStatus.ASSIGNED

    db.commit()
    db.refresh(assignment)

    log_action(
        db=db,
        entity_type="ASSIGNMENT",
        entity_id=assignment.id,
        action="ASSIGNMENT_CREATED",
        actor_id=assigned_by_id,
        actor_role=actor_role,
        details={
            "application_id": assignment.application_id,
            "assigned_officer_id": assignment.assigned_officer_id,
            "scheduled_date": assignment.scheduled_date
        }
    )
    return assignment


def get_assignment(db: Session, assignment_id: str) -> Optional[VerificationAssignment]:
    return db.query(VerificationAssignment).filter(VerificationAssignment.id == assignment_id).first()


def list_assignments(
    db: Session,
    officer_id: Optional[str] = None,
    status: Optional[AssignmentStatus] = None
) -> List[VerificationAssignment]:
    query = db.query(VerificationAssignment)
    if officer_id:
        query = query.filter(VerificationAssignment.assigned_officer_id == officer_id)
    if status:
        query = query.filter(VerificationAssignment.status == status)
    return query.order_by(VerificationAssignment.created_at.desc()).all()


def reschedule_assignment(
    db: Session,
    assignment_id: str,
    scheduled_date: str,
    scheduled_time_slot: Optional[str] = None,
    location_note: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = "LMO"
) -> VerificationAssignment:
    assignment = db.query(VerificationAssignment).filter(VerificationAssignment.id == assignment_id).first()
    if not assignment:
        raise ValueError("Assignment not found")

    assignment.scheduled_date = scheduled_date
    if scheduled_time_slot:
        assignment.scheduled_time_slot = scheduled_time_slot
    if location_note:
        assignment.location_note = location_note

    db.commit()
    db.refresh(assignment)

    log_action(
        db=db,
        entity_type="ASSIGNMENT",
        entity_id=assignment.id,
        action="ASSIGNMENT_RESCHEDULED",
        actor_id=actor_id,
        actor_role=actor_role,
        details={"scheduled_date": scheduled_date}
    )
    return assignment
