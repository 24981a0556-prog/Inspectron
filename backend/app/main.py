from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensure all models are imported for metadata creation

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.instruments import router as instruments_router
from app.api.v1.applications import router as applications_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.verifications import router as verifications_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.rules import router as rules_router
from app.api.v1.certificates import router as certificates_router
from app.api.v1.public import router as public_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.audit import router as audit_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Evidence-Driven Digital Verification & Lifecycle Intelligence for Legal Metrology (SIH-26036)",
    version="1.0.0"
)

# CORS setup
origins = list(settings.BACKEND_CORS_ORIGINS)
if settings.PUBLIC_URL and settings.PUBLIC_URL not in origins:
    origins.append(settings.PUBLIC_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under API_V1_STR
api_prefix = settings.API_V1_STR

app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{api_prefix}/users", tags=["Users"])
app.include_router(orgs_router, prefix=f"{api_prefix}/organizations", tags=["Organizations"])
app.include_router(instruments_router, prefix=f"{api_prefix}/instruments", tags=["Instruments & Passport"])
app.include_router(applications_router, prefix=f"{api_prefix}/applications", tags=["Applications"])
app.include_router(assignments_router, prefix=f"{api_prefix}/assignments", tags=["Assignments"])
app.include_router(verifications_router, prefix=f"{api_prefix}/verifications", tags=["Field Verification"])
app.include_router(evidence_router, prefix=f"{api_prefix}/evidence", tags=["Evidence"])
app.include_router(rules_router, prefix=f"{api_prefix}/rules", tags=["Rule Engine"])
app.include_router(certificates_router, prefix=f"{api_prefix}/certificates", tags=["Certificates"])
app.include_router(public_router, prefix=f"{api_prefix}/public", tags=["Public Verification"])
app.include_router(dashboard_router, prefix=f"{api_prefix}/dashboard", tags=["Dashboard"])
app.include_router(audit_router, prefix=f"{api_prefix}/audit", tags=["Audit Log"])

# Static upload storage mount (for local development preview if needed)
uploads_dir = os.path.abspath(settings.STORAGE_DIR)
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/api/v1/storage", StaticFiles(directory=uploads_dir), name="storage")


@app.get("/")
def root():
    return {
        "system": "INSPECTRA",
        "description": "Evidence-Driven Digital Verification & Lifecycle Intelligence for Legal Metrology",
        "status": "OPERATIONAL",
        "api_docs": "/docs",
        "public_verification_endpoint": f"{api_prefix}/public/verify/{{qr_token}}"
    }
