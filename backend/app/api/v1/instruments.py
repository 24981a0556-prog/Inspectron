from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.instrument import Instrument
from app.schemas.instrument import InstrumentCreate, InstrumentRead, InstrumentPassportRead
from app.api.deps import get_current_user, require_role
from app.services import instrument_service

router = APIRouter()


@router.get("/", response_model=List[InstrumentRead])
def list_instruments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Role-based visibility
    if current_user.role == UserRole.BUSINESS_USER:
        if not current_user.organization_id:
            return []
        return instrument_service.list_instruments(db, organization_id=current_user.organization_id)
    return instrument_service.list_instruments(db)


@router.post("/", response_model=InstrumentRead)
def register_instrument(
    data: InstrumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.BUSINESS_USER, UserRole.ADMIN]))
):
    org_id = current_user.organization_id if current_user.role == UserRole.BUSINESS_USER else data.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")

    return instrument_service.create_instrument(
        db=db,
        data=data,
        organization_id=org_id,
        actor_id=current_user.id,
        actor_role=current_user.role.value
    )


@router.get("/{id}", response_model=InstrumentRead)
def get_instrument(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inst = instrument_service.get_instrument(db, id)
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    # Ownership check
    if current_user.role == UserRole.BUSINESS_USER and inst.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this instrument")
    return inst


@router.get("/{id}/passport", response_model=InstrumentPassportRead)
def get_instrument_passport(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    passport = instrument_service.get_passport(db, id)
    if not passport:
        raise HTTPException(status_code=404, detail="Digital Instrument Passport not found")
    return passport
