from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.assignment import AssignmentStatus
from app.schemas.user import UserRead


class AssignmentCreate(BaseModel):
    application_id: str
    assigned_officer_id: str
    scheduled_date: str
    scheduled_time_slot: Optional[str] = "10:00 AM - 01:00 PM"
    location_note: Optional[str] = None


class AssignmentReschedule(BaseModel):
    scheduled_date: str
    scheduled_time_slot: Optional[str] = None
    location_note: Optional[str] = None


class AssignmentRead(BaseModel):
    id: str
    application_id: str
    assigned_officer_id: str
    assigned_by_id: str
    scheduled_date: str
    scheduled_time_slot: Optional[str] = None
    location_note: Optional[str] = None
    status: AssignmentStatus
    created_at: datetime
    updated_at: datetime

    assigned_officer: Optional[UserRead] = None
    assigned_by: Optional[UserRead] = None

    class Config:
        from_attributes = True
