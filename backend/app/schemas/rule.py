from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.rule import ConditionType, RuleSeverity, RuleSetStatus


class RuleResultItem(BaseModel):
    rule_code: str
    description: str
    severity: RuleSeverity
    status: str  # "PASS" or "FAIL"
    detail: Optional[str] = None


class RuleValidationResultSchema(BaseModel):
    passed: bool
    error_count: int
    warning_count: int
    evaluated_at: datetime
    rule_set_id: Optional[str] = None
    rule_set_version: Optional[str] = None
    results: List[RuleResultItem] = []


class RuleBase(BaseModel):
    rule_code: str
    description: str
    field_path: str
    condition_type: ConditionType = ConditionType.REQUIRED
    parameters: Dict[str, Any] = {}
    severity: RuleSeverity = RuleSeverity.ERROR
    is_active: bool = True


class RuleCreate(RuleBase):
    rule_set_id: str


class RuleRead(RuleBase):
    id: str
    rule_set_id: str

    class Config:
        from_attributes = True


class RuleSetBase(BaseModel):
    name: str
    instrument_type: str = "ELECTRONIC_WEIGHING"
    version: str = "1.0"
    effective_date: Optional[str] = None
    status: RuleSetStatus = RuleSetStatus.ACTIVE


class RuleSetCreate(RuleSetBase):
    pass


class RuleSetRead(RuleSetBase):
    id: str
    created_by_id: Optional[str] = None
    created_at: datetime
    rules: List[RuleRead] = []

    class Config:
        from_attributes = True
