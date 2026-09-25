# INSPECTRA
### Evidence-Driven Digital Verification & Lifecycle Intelligence for Legal Metrology
**Smart India Hackathon 2026 · Problem Statement SIH-26036**
*"Development of an Online Verification System for Weighing and Measuring Instruments"*

---

## 🎯 Executive Summary & Core Concept

**INSPECTRA** is a high-credibility working prototype built for the Smart India Hackathon 2026 national demonstration. 

Rather than treating verification as an isolated, paperwork-heavy transaction, INSPECTRA introduces the **Digital Instrument Passport**: every weighing and measuring instrument receives a permanent cryptographic identity linking its hardware specifications, owner details, statutory verification history, geotagged evidence, rule compliance evaluations, and QR-enabled digital certificates.

---

## 🏛️ Architectural Pillars (Modular Monolith)

INSPECTRA is designed as a **Modular Monolith** adhering to strict enterprise GovTech engineering standards:

1. **Modular Monolith Core**: Single deployable FastAPI service with clean in-process package boundaries between `api/`, `services/`, `models/`, and `storage/`. No inter-service network overhead or fragile microservice orchestration.
2. **API-Boundary Security (JWT + RBAC)**: Strict role-based authorization enforced exclusively at the router boundary via FastAPI `Depends()`. Domain services remain auth-blind and cleanly decoupled.
3. **Storage vs. Database Separation**: File bytes (photographs, test certificates) are stored in an abstracted `StorageBackend` (local disk or S3/object storage), while PostgreSQL strictly maintains relational metadata, hashes, and audit references.
4. **Post-Field-Capture Rule Engine**: A configurable, versioned regulatory rule engine evaluates completed, persisted field verification observations, load readings, and geotagged evidence.
5. **Authorized Decision Gating**: Digital verification certificates cannot be generated preemptively; generation is strictly gated behind an authorized LMO approval decision (`Application.status == APPROVED`).
6. **Real Public QR Verification**: Every issued certificate embeds a unique cryptographic token that resolves directly to a public, unauthenticated verification endpoint displaying live compliance records.

---

## 🚀 Demo Golden Path Lifecycle

The prototype demonstrates ONE complete end-to-end golden path:

```
[1. Business User]
   Login → View Digital Instrument Passport → Submit Verification Application (VER-2026-00128)
       ↓
[2. Legal Metrology Officer (LMO)]
   Login → Applications Review Queue → Schedule Inspection & Assign Field Officer (GATC)
       ↓
[3. GATC Field Officer]
   Mobile Field Console → Geotag Premise → Check Observations (Zero Error, Readability, Seal)
   → Input Calibrated Weight Readings (5kg, 15kg, 30kg) → Capture Evidence Photo (Offline Queue Capable)
   → Execute Rule Engine → Lock & Submit Verification
       ↓
[4. Legal Metrology Officer (LMO)]
   Inspect Validated Field Submission → Authorized Decision (APPROVED) → Generate Digital Certificate
       ↓
[5. Public / Consumer / Enforcement]
   Scan Embedded QR Code → Public Live Verification Screen (`/verify/:token`) → Authentic Record
       ↓
[6. National Admin / Supervisor]
   Lifecycle Dashboard → Regulatory Rule Engine Manager → Immutable Audit Trail
```

---

## 👥 Seed Demo Personas & Credentials

The application includes a built-in **1-Click Demo Persona Switcher** on the top navigation bar for seamless live demonstrations:

| Role | Name / Organization | Email | Password |
|---|---|---|---|
| **Business User** | Ramesh Varma (ABC Retail Store, Visakhapatnam) | `business@abcretail.demo` | `Business@1234` |
| **LMO Officer** | Rajesh Kumar (Legal Metrology Officer) | `lmo.rajesh@legal.demo` | `Lmo@1234` |
| **Field Officer** | Suresh Naidu (GATC Field Officer) | `officer@gatc.demo` | `Officer@1234` |
| **National Admin** | System Administrator | `admin@inspectra.demo` | `Admin@1234` |
| **Zonal Supervisor**| Dr. V. Rao (Zonal Supervisor) | `supervisor@legal.demo` | `Supervisor@1234` |

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL (with SQLite fallback for rapid testing), Pydantic v2, ReportLab, QRCode
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Lucide Icons, Axios
- **Storage**: Abstracted `StorageBackend` (Local filesystem / S3-ready)
- **Deployment**: Docker, Docker Compose

---

## ⚡ Quick Start Guide

### Option A: Running with Docker Compose (Recommended)

```bash
# Clone and navigate to repository root
git clone <repo-url>
cd Inspectron

# Start PostgreSQL, Backend, and Frontend
docker compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend REST API & Swagger Docs: `http://localhost:8000/docs`

---

### Option B: Running Locally for Development

#### 1. Backend Setup
```bash
# In project root:
backend\.venv\Scripts\python -m pip install -r backend/requirements.txt

# Run seed data script (creates tables, users, seed scale, ruleset)
backend\.venv\Scripts\python backend/seed/seed_data.py

# Start FastAPI server
backend\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

A comprehensive integration test suite verifies the entire golden path from login to certificate generation and public QR verification:

```bash
backend\.venv\Scripts\pytest backend/tests/test_golden_path.py -v
```

---

## ⚖️ Claim Boundaries & Integrity Disclosures

To preserve academic and statutory integrity during Hackathon evaluations:
- **No eMaap Claim**: This prototype is integration-ready with existing Legal Metrology portals, but does not claim current live integration with eMaap.
- **Configurable Demo Rules**: Rule validation in this prototype utilizes an illustrative, configurable demo ruleset (`Electronic Weighing Instrument v1.0`) and does not invent statutory tolerance values.
- **Statutory Authority**: The software automates evidence verification and auditability, but does not replace the statutory authority of an authorized Legal Metrology Officer.
- **Demo Seed Data**: All aggregate dashboard metrics and statistics are explicitly marked as seeded demonstration data.
- **No Artificial Buzzwords**: No fabricated blockchain or black-box AI claims; the system employs deterministic, auditable relational state machines and rule engines.
