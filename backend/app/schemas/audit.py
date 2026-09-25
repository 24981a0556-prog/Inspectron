from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class AuditLogRead(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
