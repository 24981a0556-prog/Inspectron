from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.verification import Verification
from app.schemas.verification import (
    VerificationCreate,
    VerificationDraftUpdate,
    VerificationRead,
    ValidationRunResponse
)
from app.api.deps import get_current_user, require_role
from app.services import verification_service, rule_engine

router = APIRouter()


@router.post("/", response_model=VerificationRead)
def start_verification(
    data: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    try:
        return verification_service.start_verification(
            db=db,
            assignment_id=data.assignment_id,
            officer_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}", response_model=VerificationRead)
def get_verification(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verification = verification_service.get_verification(db, id)
    if not verification:
        raise HTTPException(status_code=404, detail="Verification record not found")
    return verification


@router.patch("/{id}", response_model=VerificationRead)
def update_verification_draft(
    id: str,
    data: VerificationDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    try:
        return verification_service.update_draft(
            db=db,
            verification_id=id,
            data=data,
            officer_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/validate", response_model=ValidationRunResponse)
def validate_verification(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    """
    Explicit Rule Engine trigger point post field capture (Correction 4).
    Consumes complete persisted verification data and evaluates against active rule set.
    """
    try:
        return rule_engine.validate_verification(
            db=db,
            verification_id=id,
            actor_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/submit", response_model=VerificationRead)
def submit_verification(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    """
    Locks verification submission.
    Precondition: Verification.status == VALIDATED and errors == 0.
    """
    try:
        return verification_service.submit_verification(
            db=db,
            verification_id=id,
            officer_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
