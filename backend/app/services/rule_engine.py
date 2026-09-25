import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.verification import Verification, VerificationStatus
from app.models.evidence import Evidence, FileType
from app.models.rule import RuleSet, Rule, RuleSetStatus, ConditionType, RuleSeverity
from app.models.application import Application
from app.models.instrument import Instrument
from app.schemas.rule import RuleResultItem, RuleValidationResultSchema
from app.services.audit_service import log_action


def resolve_field_path(data: Dict[str, Any], path: str) -> Any:
    """
    Safely resolves dot-paths like 'measurement_data.readings' or 'evidence.image_count'
    """
    parts = path.split(".")
    curr = data
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        else:
            return None
    return curr


def evaluate_rule_condition(condition_type: ConditionType, value: Any, params: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Evaluates condition. Returns (is_pass, failure_detail).
    """
    if condition_type == ConditionType.REQUIRED:
        if value is None:
            return False, "Field is missing or null"
        if isinstance(value, str) and not value.strip():
            return False, "Text field is empty"
        if isinstance(value, (list, dict)) and len(value) == 0:
            return False, "Collection is empty; at least one entry required"
        if isinstance(value, bool) and not value:
            return False, "Checklist confirmation required"
        return True, None

    elif condition_type == ConditionType.RANGE:
        if value is None:
            return False, "Value is not provided for range check"
        try:
            num = float(value)
        except (ValueError, TypeError):
            return False, f"Value '{value}' is not numeric"

        min_val = params.get("min")
        max_val = params.get("max")

        if min_val is not None and num < float(min_val):
            return False, f"Value {num} is below minimum allowed {min_val}"
        if max_val is not None and num > float(max_val):
            return False, f"Value {num} exceeds maximum allowed {max_val}"
        return True, None

    elif condition_type == ConditionType.ENUM:
        allowed = params.get("allowed", [])
        if value not in allowed:
            return False, f"Value '{value}' not in allowed choices: {allowed}"
        return True, None

    elif condition_type == ConditionType.REGEX:
        pattern = params.get("pattern", "")
        if not isinstance(value, str) or not re.search(pattern, value):
            return False, f"Value does not match required format pattern"
        return True, None

    # CUSTOM or other fallback
    return True, None


def validate_verification(
    db: Session,
    verification_id: str,
    actor_id: Optional[str] = None,
    actor_role: str = "GATC"
) -> Dict[str, Any]:
    """
    Consumes persisted verification data, builds verification payload,
    evaluates rules against active rule set, stores JSON snapshot,
    and transitions verification status to VALIDATED (Correction 4).
    """
    verification = db.query(Verification).filter(Verification.id == verification_id).first()
    if not verification:
        raise ValueError("Verification record not found")

    application = db.query(Application).filter(Application.id == verification.application_id).first()
    instrument = db.query(Instrument).filter(Instrument.id == application.instrument_id).first() if application else None

    # Count linked evidence files
    image_count = db.query(Evidence).filter(
        Evidence.verification_id == verification.id,
        Evidence.file_type == FileType.IMAGE
    ).count()
    total_evidence_count = db.query(Evidence).filter(
        Evidence.verification_id == verification.id
    ).count()

    # Assemble VerificationPayload dict from live DB records
    payload = {
        "instrument": {
            "serial_number": instrument.serial_number if instrument else None,
            "capacity": instrument.capacity if instrument else None,
            "model": instrument.model if instrument else None,
            "manufacturer": instrument.manufacturer if instrument else None,
            "instrument_type": instrument.instrument_type.value if instrument else "ELECTRONIC_WEIGHING"
        },
        "checklist_data": verification.checklist_data or {},
        "measurement_data": verification.measurement_data or {},
        "officer_remarks": verification.officer_remarks or "",
        "latitude": verification.latitude,
        "longitude": verification.longitude,
        "evidence": {
            "image_count": image_count,
            "total_count": total_evidence_count
        }
    }

    # Fetch active RuleSet for this instrument type
    instrument_type = instrument.instrument_type.value if instrument else "ELECTRONIC_WEIGHING"
    rule_set = db.query(RuleSet).filter(
        RuleSet.instrument_type == instrument_type,
        RuleSet.status == RuleSetStatus.ACTIVE
    ).order_by(RuleSet.created_at.desc()).first()

    # If no specific active ruleset exists, get any active ruleset
    if not rule_set:
        rule_set = db.query(RuleSet).filter(RuleSet.status == RuleSetStatus.ACTIVE).first()

    results: List[Dict[str, Any]] = []
    error_count = 0
    warning_count = 0

    if rule_set and rule_set.rules:
        active_rules = [r for r in rule_set.rules if r.is_active]
        for rule in active_rules:
            val = resolve_field_path(payload, rule.field_path)
            passed, detail = evaluate_rule_condition(rule.condition_type, val, rule.parameters or {})
            
            status_str = "PASS" if passed else "FAIL"
            if not passed:
                if rule.severity == RuleSeverity.ERROR:
                    error_count += 1
                else:
                    warning_count += 1

            results.append({
                "rule_code": rule.rule_code,
                "description": rule.description,
                "severity": rule.severity.value,
                "status": status_str,
                "detail": detail
            })
    else:
        # Fallback built-in demo check if no rules in DB
        results.append({
            "rule_code": "EW-R01",
            "description": "Instrument identity verified",
            "severity": "ERROR",
            "status": "PASS" if payload["instrument"]["serial_number"] else "FAIL",
            "detail": None
        })

    validation_passed = (error_count == 0)
    now = datetime.now(timezone.utc)

    validation_result_dict = {
        "passed": validation_passed,
        "error_count": error_count,
        "warning_count": warning_count,
        "evaluated_at": now.isoformat(),
        "rule_set_id": rule_set.id if rule_set else None,
        "rule_set_version": rule_set.version if rule_set else "1.0",
        "results": results
    }

    # Persist validation snapshot into Verification
    verification.rule_validation_result = validation_result_dict
    verification.rule_validated_at = now
    
    # Transition status: DRAFT -> VALIDATED
    verification.status = VerificationStatus.VALIDATED

    db.commit()
    db.refresh(verification)

    log_action(
        db=db,
        entity_type="VERIFICATION",
        entity_id=verification.id,
        action="RULE_VALIDATION_PERFORMED",
        actor_id=actor_id,
        actor_role=actor_role,
        details={
            "passed": validation_passed,
            "error_count": error_count,
            "warning_count": warning_count
        }
    )

    return {
        "verification_id": verification.id,
        "status": verification.status.value,
        "rule_validation_result": validation_result_dict,
        "can_submit": validation_passed
    }
