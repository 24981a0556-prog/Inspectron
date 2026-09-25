import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, BinaryIO, Union
from sqlalchemy.orm import Session
from app.models.evidence import Evidence, FileType
from app.models.verification import Verification
from app.storage import storage_backend
from app.services.audit_service import log_action


def upload_evidence(
    db: Session,
    verification_id: str,
    file_bytes: Union[bytes, BinaryIO],
    original_filename: str,
    mime_type: str,
    description: Optional[str] = None,
    uploader_id: Optional[str] = None,
    captured_at: Optional[datetime] = None,
    actor_role: str = "GATC"
) -> Evidence:
    verification = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verification:
        raise ValueError("Verification not found")

    # Determine file type
    file_type = FileType.IMAGE
    if "pdf" in mime_type.lower() or original_filename.lower().endswith(".pdf"):
        file_type = FileType.PDF
    elif "video" in mime_type.lower():
        file_type = FileType.VIDEO

    # 1. Save bytes to StorageBackend first
    clean_original = os.path.basename(original_filename)
    unique_name = f"{uuid.uuid4().hex[:12]}_{clean_original}"
    dest_subpath = f"evidence/{verification_id}/{unique_name}"
    
    stored_path = storage_backend.save(file_bytes, dest_subpath)

    # Calculate file size if bytes
    file_size = len(file_bytes) if isinstance(file_bytes, bytes) else 0

    # 2. Persist metadata record in PostgreSQL (Metadata only, no bytes)
    evidence = Evidence(
        verification_id=verification_id,
        original_filename=clean_original,
        stored_filename=unique_name,
        storage_path=stored_path,
        file_size_bytes=file_size,
        mime_type=mime_type,
        file_type=file_type,
        description=description,
        captured_at=captured_at or datetime.now(timezone.utc),
        uploader_id=uploader_id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    log_action(
        db=db,
        entity_type="EVIDENCE",
        entity_id=evidence.id,
        action="EVIDENCE_UPLOADED",
        actor_id=uploader_id,
        actor_role=actor_role,
        details={
            "verification_id": verification_id,
            "filename": original_filename,
            "stored_path": stored_path,
            "file_type": file_type.value
        }
    )
    return evidence


def get_evidence(db: Session, evidence_id: str) -> Optional[Evidence]:
    return db.query(Evidence).filter(Evidence.id == evidence_id).first()


def delete_evidence(
    db: Session,
    evidence_id: str,
    actor_id: Optional[str] = None,
    actor_role: str = "GATC"
) -> bool:
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        return False

    # 1. Delete from StorageBackend
    try:
        storage_backend.delete(evidence.storage_path)
    except Exception:
        pass

    # 2. Delete metadata from DB
    db.delete(evidence)
    db.commit()

    log_action(
        db=db,
        entity_type="EVIDENCE",
        entity_id=evidence_id,
        action="EVIDENCE_DELETED",
        actor_id=actor_id,
        actor_role=actor_role,
        details={"stored_path": evidence.storage_path}
    )
    return True
