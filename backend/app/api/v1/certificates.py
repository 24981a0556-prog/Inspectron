from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.certificate import CertificateGenerateRequest, CertificateRead
from app.api.deps import get_current_user, require_role
from app.services import certificate_service
from app.storage import storage_backend

router = APIRouter()


@router.post("/", response_model=CertificateRead)
def generate_certificate(
    data: CertificateGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.LMO, UserRole.ADMIN]))
):
    """
    Generate Digital Verification Certificate (Correction 5).
    Hard-gated behind Application.status == APPROVED.
    """
    try:
        cert = certificate_service.generate_certificate(
            db=db,
            application_id=data.application_id,
            issued_by_id=current_user.id,
            actor_role=current_user.role.value
        )
        res = CertificateRead.model_validate(cert)
        res.pdf_url = f"/api/v1/certificates/{cert.id}/pdf"
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}", response_model=CertificateRead)
def get_certificate(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cert = certificate_service.get_certificate(db, id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    res = CertificateRead.model_validate(cert)
    res.pdf_url = f"/api/v1/certificates/{cert.id}/pdf"
    return res


@router.get("/{id}/pdf")
def stream_certificate_pdf(
    id: str,
    db: Session = Depends(get_db)
):
    cert = certificate_service.get_certificate(db, id)
    if not cert or not cert.pdf_storage_path:
        raise HTTPException(status_code=404, detail="Certificate PDF not found")

    abs_path = storage_backend.get_absolute_path(cert.pdf_storage_path)
    return FileResponse(
        path=abs_path,
        media_type="application/pdf",
        filename=f"{cert.certificate_number}.pdf"
    )
