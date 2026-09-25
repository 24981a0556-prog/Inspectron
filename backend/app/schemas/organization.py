from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class OrganizationBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gstin: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationRead(OrganizationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
