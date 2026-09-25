from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.application import ApplicationStatus, ApplicationType
from app.schemas.instrument import InstrumentRead
from app.schemas.user import UserRead


class ApplicationBase(BaseModel):
    instrument_id: str
    application_type: ApplicationType = ApplicationType.INITIAL
    purpose: Optional[str] = None
    notes: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationReviewRequest(BaseModel):
    notes: Optional[str] = None


class ApplicationAuthorizeRequest(BaseModel):
    decision: str = "APPROVED"  # APPROVED or REJECTED
    remarks: Optional[str] = None


class ApplicationRead(BaseModel):
    id: str
    application_number: str
    instrument_id: str
    applicant_id: str
    application_type: ApplicationType
    status: ApplicationStatus
    purpose: Optional[str] = None
    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[str] = None
    authorized_at: Optional[datetime] = None
    authorized_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    instrument: Optional[InstrumentRead] = None
    applicant: Optional[UserRead] = None
    reviewed_by: Optional[UserRead] = None
    authorized_by: Optional[UserRead] = None

    class Config:
        from_attributes = True
