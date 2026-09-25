from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class BusinessDashboardStats(BaseModel):
    total_instruments: int
    active_instruments: int
    pending_applications: int
    verified_instruments: int
    is_demo_seed_data: bool = True
    recent_activity: List[Dict[str, Any]] = []


class LMODashboardStats(BaseModel):
    pending_review_count: int
    active_assignments_count: int
    awaiting_authorization_count: int
    certificates_issued_count: int
    is_demo_seed_data: bool = True
    urgent_applications: List[Dict[str, Any]] = []


class AdminDashboardStats(BaseModel):
    total_organizations: int
    total_instruments: int
    total_users: int
    total_certificates: int
    status_distribution: List[StatusCount] = []
    is_demo_seed_data: bool = True
