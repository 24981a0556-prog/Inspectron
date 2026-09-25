import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from seed.seed_data import seed_all

# Seed database before test
seed_all()
client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "INSPECTRA"


def test_login_and_me():
    # Login as Business User
    res = client.post("/api/v1/auth/login", json={
        "email": "business@abcretail.demo",
        "password": "Business@1234"
    })
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    assert token_data["role"] == "BUSINESS_USER"

    # Profile check
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "business@abcretail.demo"


def test_instrument_and_passport():
    res = client.post("/api/v1/auth/login", json={
        "email": "business@abcretail.demo",
        "password": "Business@1234"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List instruments
    inst_res = client.get("/api/v1/instruments/", headers=headers)
    assert inst_res.status_code == 200
    instruments = inst_res.json()
    assert len(instruments) >= 1
    inst_id = instruments[0]["id"]

    # Passport view
    pass_res = client.get(f"/api/v1/instruments/{inst_id}/passport", headers=headers)
    assert pass_res.status_code == 200
    passport = pass_res.json()
    assert passport["serial_number"] == "AP-EW-2026-00128"
    assert "organization" in passport
    assert passport["organization"]["name"] == "ABC Retail Store"


def test_golden_path_end_to_end():
    # 1. Business user checks existing application
    b_res = client.post("/api/v1/auth/login", json={"email": "business@abcretail.demo", "password": "Business@1234"})
    b_token = b_res.json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}

    apps = client.get("/api/v1/applications/", headers=b_headers).json()
    assert len(apps) >= 1
    app_id = apps[0]["id"]

    # 2. LMO Login, reviews application and assigns officer
    lmo_res = client.post("/api/v1/auth/login", json={"email": "lmo.rajesh@legal.demo", "password": "Lmo@1234"})
    lmo_token = lmo_res.json()["access_token"]
    lmo_headers = {"Authorization": f"Bearer {lmo_token}"}

    review_res = client.post(f"/api/v1/applications/{app_id}/review", json={"notes": "Application verified. Scheduling inspection."}, headers=lmo_headers)
    assert review_res.status_code == 200

    # Get Field officer user ID
    gatc_login = client.post("/api/v1/auth/login", json={"email": "officer@gatc.demo", "password": "Officer@1234"}).json()
    gatc_id = gatc_login["user_id"]
    gatc_token = gatc_login["access_token"]
    gatc_headers = {"Authorization": f"Bearer {gatc_token}"}

    assign_res = client.post("/api/v1/assignments/", json={
        "application_id": app_id,
        "assigned_officer_id": gatc_id,
        "scheduled_date": "2026-09-26",
        "scheduled_time_slot": "10:00 AM - 12:00 PM",
        "location_note": "Counter 02, Ground Floor"
    }, headers=lmo_headers)
    assert assign_res.status_code == 200
    assignment_id = assign_res.json()["id"]

    # 3. GATC Field Officer starts verification
    start_v = client.post("/api/v1/verifications/", json={"assignment_id": assignment_id}, headers=gatc_headers)
    assert start_v.status_code == 200
    verif_id = start_v.json()["id"]

    # Officer enters observations, readings, location
    draft_res = client.patch(f"/api/v1/verifications/{verif_id}", json={
        "checklist_data": {
            "zero_error_checked": True,
            "readability_checked": True,
            "leveling_checked": True
        },
        "measurement_data": {
            "readings": [
                {"nominal_kg": 5.0, "observed_kg": 5.000, "error_g": 0.0, "status": "PASS"},
                {"nominal_kg": 15.0, "observed_kg": 15.002, "error_g": 2.0, "status": "PASS"},
                {"nominal_kg": 30.0, "observed_kg": 30.005, "error_g": 5.0, "status": "PASS"}
            ]
        },
        "officer_remarks": "Instrument tested with standard calibrated weights. Tolerance within regulatory limits.",
        "latitude": 17.7041,
        "longitude": 83.2977
    }, headers=gatc_headers)
    assert draft_res.status_code == 200

    # Upload evidence photo (Correction 3)
    dummy_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    ev_res = client.post(
        "/api/v1/evidence/",
        data={"verification_id": verif_id, "description": "Instrument physical display & seal photo"},
        files={"file": ("instrument_seal.png", dummy_image, "image/png")},
        headers=gatc_headers
    )
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["storage_path"].startswith("evidence/")

    # 4. Explicit Rule Validation post field capture (Correction 4)
    val_res = client.post(f"/api/v1/verifications/{verif_id}/validate", headers=gatc_headers)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["status"] == "VALIDATED"
    assert val_data["rule_validation_result"]["passed"] is True

    # 5. Officer locks and submits verification
    sub_res = client.post(f"/api/v1/verifications/{verif_id}/submit", headers=gatc_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"

    # 6. Attempting certificate generation before authorized decision must FAIL (Correction 5)
    cert_fail = client.post("/api/v1/certificates/", json={"application_id": app_id}, headers=lmo_headers)
    assert cert_fail.status_code == 400
    assert "Authorized Approval" in cert_fail.json()["detail"]

    # 7. LMO makes Authorized Decision: APPROVED (Correction 5)
    auth_decision = client.post(f"/api/v1/applications/{app_id}/authorize", json={
        "decision": "APPROVED",
        "remarks": "Statutory verification verified and approved under Rule 14."
    }, headers=lmo_headers)
    assert auth_decision.status_code == 200
    assert auth_decision.json()["status"] == "APPROVED"

    # 8. Certificate generation now succeeds! (Correction 5)
    cert_res = client.post("/api/v1/certificates/", json={"application_id": app_id}, headers=lmo_headers)
    assert cert_res.status_code == 200
    cert_data = cert_res.json()
    assert cert_data["status"] == "ACTIVE"
    assert "LM-2026-" in cert_data["certificate_number"]
    qr_token = cert_data["qr_token"]

    # 9. Public QR Verification Endpoint (NO AUTH REQUIRED)
    pub_res = client.get(f"/api/v1/public/verify/{qr_token}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["valid"] is True
    assert pub_data["certificate_number"] == cert_data["certificate_number"]
    assert pub_data["instrument"]["serial_number"] == "AP-EW-2026-00128"
    assert pub_data["owner"]["name"] == "ABC Retail Store"
