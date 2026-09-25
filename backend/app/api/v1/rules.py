from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.rule import RuleSet, Rule, RuleSetStatus
from app.schemas.rule import RuleSetCreate, RuleSetRead, RuleCreate, RuleRead
from app.api.deps import require_role

router = APIRouter()


@router.get("/rulesets/", response_model=List[RuleSetRead])
def list_rulesets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.LMO, UserRole.GATC]))
):
    return db.query(RuleSet).order_by(RuleSet.created_at.desc()).all()


@router.post("/rulesets/", response_model=RuleSetRead)
def create_ruleset(
    data: RuleSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    rs = RuleSet(
        name=data.name,
        instrument_type=data.instrument_type,
        version=data.version,
        effective_date=data.effective_date,
        status=data.status,
        created_by_id=current_user.id
    )
    db.add(rs)
    db.commit()
    db.refresh(rs)
    return rs


@router.get("/rulesets/{id}/rules", response_model=List[RuleRead])
def list_rules(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.LMO, UserRole.GATC]))
):
    return db.query(Rule).filter(Rule.rule_set_id == id).all()


@router.post("/rulesets/{id}/rules", response_model=RuleRead)
def add_rule(
    id: str,
    data: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    rs = db.query(RuleSet).filter(RuleSet.id == id).first()
    if not rs:
        raise HTTPException(status_code=404, detail="Rule set not found")

    rule = Rule(
        rule_set_id=id,
        rule_code=data.rule_code,
        description=data.description,
        field_path=data.field_path,
        condition_type=data.condition_type,
        parameters=data.parameters,
        severity=data.severity,
        is_active=data.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/rulesets/{id}/activate", response_model=RuleSetRead)
def activate_ruleset(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    rs = db.query(RuleSet).filter(RuleSet.id == id).first()
    if not rs:
        raise HTTPException(status_code=404, detail="Rule set not found")

    # Archive previous active rule sets for this instrument type
    previous = db.query(RuleSet).filter(
        RuleSet.instrument_type == rs.instrument_type,
        RuleSet.status == RuleSetStatus.ACTIVE,
        RuleSet.id != id
    ).all()
    for prev in previous:
        prev.status = RuleSetStatus.ARCHIVED

    rs.status = RuleSetStatus.ACTIVE
    db.commit()
    db.refresh(rs)
    return rs
