from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole
    organization_id: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
