from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.evidence import FileType


class EvidenceRead(BaseModel):
    id: str
    verification_id: str
    original_filename: str
    stored_filename: str
    storage_path: str
    file_size_bytes: int
    mime_type: str
    file_type: FileType
    description: Optional[str] = None
    captured_at: Optional[datetime] = None
    uploaded_at: datetime
    uploader_id: Optional[str] = None
    download_url: Optional[str] = None

    class Config:
        from_attributes = True
