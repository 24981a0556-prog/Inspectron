from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str
    organization_id: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    organization_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
