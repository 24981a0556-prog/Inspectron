from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationReviewRequest,
    ApplicationAuthorizeRequest
)
from app.api.deps import get_current_user, require_role
from app.services import application_service

router = APIRouter()


@router.get("/", response_model=List[ApplicationRead])
def list_applications(
    status: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.BUSINESS_USER:
        return application_service.list_applications(db, applicant_id=current_user.id, status=status)
    return application_service.list_applications(db, status=status)


@router.post("/", response_model=ApplicationRead)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.BUSINESS_USER, UserRole.ADMIN]))
):
    return application_service.create_application(
        db=db,
        data=data,
        applicant_id=current_user.id,
        actor_role=current_user.role.value
    )


@router.get("/{id}", response_model=ApplicationRead)
def get_application(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = application_service.get_application(db, id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.BUSINESS_USER and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this application")
    return app


@router.post("/{id}/submit", response_model=ApplicationRead)
def submit_application(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.BUSINESS_USER, UserRole.ADMIN]))
):
    app = application_service.get_application(db, id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == UserRole.BUSINESS_USER and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this application")

    try:
        return application_service.submit_application(
            db=db,
            application_id=id,
            actor_id=current_user.id,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/review", response_model=ApplicationRead)
def review_application(
    id: str,
    data: ApplicationReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    try:
        return application_service.review_application(
            db=db,
            application_id=id,
            reviewer_id=current_user.id,
            notes=data.notes,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/reject", response_model=ApplicationRead)
def reject_application(
    id: str,
    data: ApplicationReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    try:
        return application_service.reject_application(
            db=db,
            application_id=id,
            reviewer_id=current_user.id,
            reason=data.notes or "Application does not meet requirements",
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/authorize", response_model=ApplicationRead)
def authorize_application(
    id: str,
    data: ApplicationAuthorizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    """
    Authorized Decision gate (Correction 5).
    Marks application as APPROVED or REJECTED.
    Only when APPROVED can certificate generation proceed.
    """
    try:
        return application_service.authorize_application(
            db=db,
            application_id=id,
            authorizer_id=current_user.id,
            decision=data.decision,
            remarks=data.remarks,
            actor_role=current_user.role.value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
