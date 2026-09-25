from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogRead
from app.api.deps import require_role

router = APIRouter()


@router.get("/", response_model=List[AuditLogRead])
def list_audit_logs(
    entity_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.LMO]))
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()


@router.get("/{entity_type}/{id}", response_model=List[AuditLogRead])
def get_entity_audit_logs(
    entity_type: str,
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.LMO]))
):
    return db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type.upper(),
        AuditLog.entity_id == id
    ).order_by(AuditLog.timestamp.desc()).all()
