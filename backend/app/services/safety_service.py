"""
Medicus Care™ — Backend Safety Service Adapter
Exposes Medical Safety Validator and Crisis Detection to FastAPI and WebSocket endpoints.
"""

import sys
from pathlib import Path

# Add root folder to path to import medical-safety module
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from medical_safety.safety_validator import MedicalSafetyValidator, safety_validator as medical_safety_validator
except ImportError:
    # Local fallback inline
    from app.services.llm import LLMService
    from dataclasses import dataclass
    from enum import IntEnum
    from typing import Optional, List

    class TriageLevel(IntEnum):
        LEVEL_1_GENERAL = 1
        LEVEL_2_ASSESSMENT = 2
        LEVEL_3_URGENT = 3
        LEVEL_4_EMERGENCY = 4

    @dataclass
    class SafetyValidationResult:
        is_safe: bool
        triage_level: TriageLevel
        is_emergency: bool
        emergency_message: Optional[str]
        warning_signs: List[str]
        disclaimer_required: bool

    class MedicalSafetyValidator:
        def evaluate_patient_query(self, query: str) -> SafetyValidationResult:
            q = query.lower()
            if any(k in q for k in [
                "chest pain", "heart attack", "breathe", "kill myself", "suicide",
                "end my life", "stroke", "slurred speech", "arm weakness", "facial drooping",
            ]):
                return SafetyValidationResult(
                    is_safe=True,
                    triage_level=TriageLevel.LEVEL_4_EMERGENCY,
                    is_emergency=True,
                    emergency_message="EMERGENCY ALERT: Call 112 immediately.",
                    warning_signs=["Critical emergency signs"],
                    disclaimer_required=True
                )
            return SafetyValidationResult(
                is_safe=True,
                triage_level=TriageLevel.LEVEL_1_GENERAL,
                is_emergency=False,
                emergency_message=None,
                warning_signs=[],
                disclaimer_required=True
            )

        def validate_ai_response(self, response_text: str):
            lower = response_text.lower()
            if "prescribe" in lower or "take " in lower and any(unit in lower for unit in ("mg", "ml", "tablet", "capsule")):
                return True, "Discuss appropriate medication and dosing with your attending physician."
            if "you are diagnosed with" in lower or "you definitely have" in lower:
                return True, "The clinical presentation may suggest possibilities that require assessment by a qualified clinician."
            return True, response_text

    medical_safety_validator = MedicalSafetyValidator()

__all__ = ["medical_safety_validator", "MedicalSafetyValidator"]
