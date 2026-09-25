import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class RuleSetStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class ConditionType(str, enum.Enum):
    REQUIRED = "REQUIRED"
    RANGE = "RANGE"
    ENUM = "ENUM"
    REGEX = "REGEX"
    CUSTOM = "CUSTOM"


class RuleSeverity(str, enum.Enum):
    ERROR = "ERROR"
    WARNING = "WARNING"


class RuleSet(Base):
    __tablename__ = "rule_sets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    instrument_type = Column(String(100), nullable=False, default="ELECTRONIC_WEIGHING")
    version = Column(String(50), nullable=False, default="1.0")
    effective_date = Column(String(50), nullable=True)
    status = Column(Enum(RuleSetStatus), default=RuleSetStatus.ACTIVE, nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rules = relationship("Rule", back_populates="rule_set", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_id])


class Rule(Base):
    __tablename__ = "rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_set_id = Column(String(36), ForeignKey("rule_sets.id", ondelete="CASCADE"), nullable=False)
    rule_code = Column(String(50), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    field_path = Column(String(255), nullable=False)
    condition_type = Column(Enum(ConditionType), default=ConditionType.REQUIRED, nullable=False)
    parameters = Column(JSON, default=dict, nullable=False)
    severity = Column(Enum(RuleSeverity), default=RuleSeverity.ERROR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    rule_set = relationship("RuleSet", back_populates="rules")
