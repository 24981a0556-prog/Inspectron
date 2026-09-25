import os
import sys
from datetime import datetime, timezone

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.instrument import Instrument, InstrumentStatus, InstrumentType
from app.models.application import Application, ApplicationStatus, ApplicationType
from app.models.rule import RuleSet, Rule, RuleSetStatus, ConditionType, RuleSeverity
from app.models.certificate import Certificate, CertificateStatus
from app.services.audit_service import log_action

def seed_all():
    print("[*] Initializing INSPECTRA Seed Data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Organization
        org = db.query(Organization).filter(Organization.name == "ABC Retail Store").first()
        if not org:
            org = Organization(
                name="ABC Retail Store",
                address="Shop 14, Commercial Complex, Daba Gardens",
                city="Visakhapatnam",
                state="Andhra Pradesh",
                gstin="37AAAAA0000A1Z5",
                contact_email="contact@abcretail.demo"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print("[+] Seeded Organization: ABC Retail Store (Visakhapatnam, AP)")
        else:
            print("[-] Organization already exists")

        # 2. Users with explicit demo credentials
        users_data = [
            ("admin@inspectra.demo", "Admin@1234", "System Administrator", UserRole.ADMIN, None),
            ("business@abcretail.demo", "Business@1234", "Ramesh Varma (ABC Retail)", UserRole.BUSINESS_USER, org.id),
            ("lmo.rajesh@legal.demo", "Lmo@1234", "Rajesh Kumar (Legal Metrology Officer)", UserRole.LMO, None),
            ("officer@gatc.demo", "Officer@1234", "Suresh Naidu (GATC Field Officer)", UserRole.GATC, None),
            ("supervisor@legal.demo", "Supervisor@1234", "Dr. V. Rao (Zonal Supervisor)", UserRole.SUPERVISOR, None)
        ]

        created_users = {}
        for email, pwd, name, role, org_id in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    organization_id=org_id,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[+] Seeded User: {email} ({role.value})")
            else:
                print(f"[-] User already exists: {email}")
            created_users[role.value] = user

        # 3. Instrument (Electronic Weighing Instrument EW-30)
        instrument = db.query(Instrument).filter(Instrument.serial_number == "AP-EW-2026-00128").first()
        if not instrument:
            instrument = Instrument(
                passport_id="INST-AP-00128",
                organization_id=org.id,
                instrument_type=InstrumentType.ELECTRONIC_WEIGHING,
                manufacturer="Apex Instruments",
                model="EW-30",
                serial_number="AP-EW-2026-00128",
                capacity=30.0,
                capacity_unit="kg",
                manufacture_year=2024,
                purchase_date="2024-03-15",
                location_description="Counter 02 - Billing Section, Ground Floor",
                status=InstrumentStatus.ACTIVE
            )
            db.add(instrument)
            db.commit()
            db.refresh(instrument)
            print("[+] Seeded Instrument: Apex Instruments EW-30 (INST-AP-00128)")
        else:
            print("[-] Instrument already exists")

        # 4. Configurable Regulatory Rule Set
        rule_set = db.query(RuleSet).filter(RuleSet.name == "Electronic Weighing Instrument - Demo Rules v1.0").first()
        if not rule_set:
            rule_set = RuleSet(
                name="Electronic Weighing Instrument - Demo Rules v1.0",
                instrument_type="ELECTRONIC_WEIGHING",
                version="1.0",
                effective_date="2026-01-01",
                status=RuleSetStatus.ACTIVE,
                created_by_id=created_users.get("ADMIN").id
            )
            db.add(rule_set)
            db.commit()
            db.refresh(rule_set)

            rules = [
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R01",
                    description="Instrument serial number and identity must be recorded",
                    field_path="instrument.serial_number",
                    condition_type=ConditionType.REQUIRED,
                    parameters={},
                    severity=RuleSeverity.ERROR,
                    is_active=True
                ),
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R02",
                    description="At least one test load measurement reading must be recorded",
                    field_path="measurement_data.readings",
                    condition_type=ConditionType.REQUIRED,
                    parameters={},
                    severity=RuleSeverity.ERROR,
                    is_active=True
                ),
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R03",
                    description="Verifying officer remarks and inspection notes must be provided",
                    field_path="officer_remarks",
                    condition_type=ConditionType.REQUIRED,
                    parameters={},
                    severity=RuleSeverity.ERROR,
                    is_active=True
                ),
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R04",
                    description="At least one geotagged physical evidence photo must be uploaded",
                    field_path="evidence.image_count",
                    condition_type=ConditionType.RANGE,
                    parameters={"min": 1},
                    severity=RuleSeverity.ERROR,
                    is_active=True
                ),
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R05",
                    description="Zero error observation check must be completed",
                    field_path="checklist_data.zero_error_checked",
                    condition_type=ConditionType.REQUIRED,
                    parameters={},
                    severity=RuleSeverity.ERROR,
                    is_active=True
                ),
                Rule(
                    rule_set_id=rule_set.id,
                    rule_code="EW-R06",
                    description="Readability and display illumination check must be verified",
                    field_path="checklist_data.readability_checked",
                    condition_type=ConditionType.REQUIRED,
                    parameters={},
                    severity=RuleSeverity.WARNING,
                    is_active=True
                )
            ]
            db.add_all(rules)
            db.commit()
            print("[+] Seeded RuleSet & 6 Regulatory Rules for Electronic Weighing")
        else:
            print("[-] RuleSet already exists")

        # 5. Seed Golden-Path Application (VER-2026-00128 in SUBMITTED state ready for live demo!)
        application = db.query(Application).filter(Application.application_number == "VER-2026-00128").first()
        business_user = created_users.get("BUSINESS_USER")
        if not application and business_user:
            application = Application(
                application_number="VER-2026-00128",
                instrument_id=instrument.id,
                applicant_id=business_user.id,
                application_type=ApplicationType.INITIAL,
                status=ApplicationStatus.SUBMITTED,
                purpose="Annual Statutory Verification of Commercial Weighing Scale",
                notes="Initial statutory verification requested for newly installed retail scale.",
                submitted_at=datetime.now(timezone.utc)
            )
            db.add(application)
            db.commit()
            db.refresh(application)
            print("[+] Seeded Application VER-2026-00128 (Status: SUBMITTED - ready for LMO review)")

        print("\n[OK] INSPECTRA Demo Database seeded successfully!")
        print("\nCredentials Summary:")
        print("  * Admin:         admin@inspectra.demo       / Admin@1234")
        print("  * Business User: business@abcretail.demo    / Business@1234")
        print("  * LMO Officer:   lmo.rajesh@legal.demo      / Lmo@1234")
        print("  * Field Officer: officer@gatc.demo          / Officer@1234")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
