from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationRead
from app.api.deps import require_role

router = APIRouter()


@router.get("/", response_model=List[OrganizationRead])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.LMO]))
):
    return db.query(Organization).order_by(Organization.name).all()


@router.post("/", response_model=OrganizationRead)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    org = Organization(
        name=data.name,
        address=data.address,
        city=data.city,
        state=data.state,
        gstin=data.gstin,
        contact_email=data.contact_email
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org
