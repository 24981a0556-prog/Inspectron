from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.evidence import EvidenceRead
from app.api.deps import get_current_user, require_role
from app.services import evidence_service
from app.storage import storage_backend

router = APIRouter()


@router.post("/", response_model=EvidenceRead)
async def upload_evidence(
    verification_id: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    """
    Evidence upload endpoint (Correction 3):
    Coordinates file storage in StorageBackend and metadata row in PostgreSQL.
    """
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        evidence = evidence_service.upload_evidence(
            db=db,
            verification_id=verification_id,
            file_bytes=contents,
            original_filename=file.filename or "evidence.jpg",
            mime_type=file.content_type or "image/jpeg",
            description=description,
            uploader_id=current_user.id,
            actor_role=current_user.role.value
        )
        # Attach download url
        download_url = f"/api/v1/evidence/{evidence.id}/download"
        res = EvidenceRead.model_validate(evidence)
        res.download_url = download_url
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/download")
def download_evidence(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = evidence_service.get_evidence(db, id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    abs_path = storage_backend.get_absolute_path(evidence.storage_path)
    return FileResponse(
        path=abs_path,
        media_type=evidence.mime_type,
        filename=evidence.original_filename
    )


@router.delete("/{id}")
def delete_evidence(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.GATC, UserRole.ADMIN]))
):
    success = evidence_service.delete_evidence(
        db=db,
        evidence_id=id,
        actor_id=current_user.id,
        actor_role=current_user.role.value
    )
    if not success:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return {"message": "Evidence deleted successfully"}
