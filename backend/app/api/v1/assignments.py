from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.assignment import AssignmentStatus
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentReschedule
from app.api.deps import get_current_user, require_role
from app.services import assignment_service

router = APIRouter()


@router.post("/", response_model=AssignmentRead)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    try:
        return assignment_service.create_assignment(
            db=db,
            data=data,
            assigned_by_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[AssignmentRead])
def list_assignments(
    status: Optional[AssignmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.GATC:
        # Field officer sees only their assignments
        return assignment_service.list_assignments(db, officer_id=current_user.id, status=status)
    return assignment_service.list_assignments(db, status=status)


@router.get("/{id}", response_model=AssignmentRead)
def get_assignment(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = assignment_service.get_assignment(db, id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role == UserRole.GATC and assignment.assigned_officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this assignment")
    return assignment


@router.patch("/{id}/reschedule", response_model=AssignmentRead)
def reschedule_assignment(
    id: str,
    data: AssignmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    try:
        return assignment_service.reschedule_assignment(
            db=db,
            assignment_id=id,
            scheduled_date=data.scheduled_date,
            scheduled_time_slot=data.scheduled_time_slot,
            location_note=data.location_note,
            actor_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
