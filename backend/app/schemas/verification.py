from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.verification import VerificationStatus
from app.schemas.evidence import EvidenceRead
from app.schemas.rule import RuleValidationResultSchema
from app.schemas.user import UserRead


class VerificationCreate(BaseModel):
    assignment_id: str


class VerificationDraftUpdate(BaseModel):
    checklist_data: Optional[Dict[str, Any]] = None
    measurement_data: Optional[Dict[str, Any]] = None
    officer_remarks: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VerificationRead(BaseModel):
    id: str
    assignment_id: str
    application_id: str
    officer_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_captured_at: Optional[datetime] = None
    checklist_data: Dict[str, Any] = {}
    measurement_data: Dict[str, Any] = {}
    officer_remarks: Optional[str] = None
    rule_validation_result: Optional[RuleValidationResultSchema] = None
    rule_validated_at: Optional[datetime] = None
    status: VerificationStatus
    created_at: datetime
    updated_at: datetime

    officer: Optional[UserRead] = None
    evidence: List[EvidenceRead] = []

    class Config:
        from_attributes = True


class ValidationRunResponse(BaseModel):
    verification_id: str
    status: VerificationStatus
    rule_validation_result: RuleValidationResultSchema
    can_submit: bool
