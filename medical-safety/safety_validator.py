"""
Medicus Care™ — Medical Safety & Clinical Response Validation Engine
Strict adherence to Telemedicine Practice Guidelines and DPDP 2023.
"""

from typing import Tuple, List, Optional
import re
from dataclasses import dataclass
from enum import IntEnum

class TriageLevel(IntEnum):
    LEVEL_1_GENERAL = 1      # Preventive, self-care education, lifestyle
    LEVEL_2_ASSESSMENT = 2   # Non-urgent evaluation advised for persistent symptoms
    LEVEL_3_URGENT = 3       # Priority outpatient medical evaluation needed
    LEVEL_4_EMERGENCY = 4    # Immediate life-threatening signs; call 112

@dataclass
class SafetyValidationResult:
    is_safe: bool
    triage_level: TriageLevel
    is_emergency: bool
    emergency_message: Optional[str]
    warning_signs: List[str]
    disclaimer_required: bool
    blocked_reason: Optional[str] = None
    sanitized_response: Optional[str] = None

class MedicalSafetyValidator:
    # Critical Red Flags requiring immediate 112 emergency escalation
    EMERGENCY_TRIGGERS = [
        r"\bchest pain\b",
        r"\bheart attack\b",
        r"\bcrushing (chest|substernal)\b",
        r"\b(cannot|unable to|struggling to) breathe\b",
        r"\bsevere (shortness of breath|dyspnea)\b",
        r"\bstroke\b",
        r"\b(facial drooping|arm weakness|slurred speech)\b",
        r"\bunconscious\b",
        r"\bpassed out\b",
        r"\bloss of consciousness\b",
        r"\bsevere bleeding\b",
        r"\bvomiting blood\b",
        r"\bhaemoptysis|coughing blood\b",
        r"\banaphylaxis|throat closing\b",
        r"\bsuicid(e|al)|kill myself|end my life\b",
    ]

    # Level 3 Urgent Triggers
    URGENT_TRIGGERS = [
        r"\bhigh fever.*(stiff neck|confusion)\b",
        r"\bunbearable abdominal pain\b",
        r"\bacute appendicitis\b",
        r"\bpersistent vomiting.*dehydration\b",
        r"\bsudden vision loss\b",
        r"\bdeep wound|open fracture\b",
    ]

    # Prohibited Prescription & Autonomous Claims Patterns
    PRESCRIPTION_PATTERNS = [
        r"\btake \d+\s*(mg|ml|tablets?|capsules?)\b",
        r"\bprescribe\b",
        r"\bi recommend taking (amoxicillin|azithromycin|ciprofloxacin|prednisone|tramadol|alprazolam)\b",
        r"\bstart a course of\b",
    ]

    DIAGNOSIS_CLAIM_PATTERNS = [
        r"\byou definitely have\b",
        r"\bmy diagnosis is\b",
        r"\byou are diagnosed with\b",
        r"\byou have tested positive for\b",
    ]

    MANDATORY_DISCLAIMER = (
        "Medicus Care is an AI healthcare digital assistant and not a licensed human physician. "
        "Information provided is for preliminary educational guidance and does not replace formal clinical diagnosis or prescription. "
        "In case of a medical emergency, call 112 immediately."
    )

    def __init__(self, country_code: str = "IN"):
        self.country_code = country_code
        self.emergency_hotline = "112" if country_code == "IN" else "911"
        self.mental_health_helpline = "1800-599-0019" # KIRAN India

    def evaluate_patient_query(self, query: str) -> SafetyValidationResult:
        """Analyze patient symptoms for emergency flags and triage level."""
        lower = query.lower()
        warning_signs = []

        # Check Emergency Level 4
        for pattern in self.EMERGENCY_TRIGGERS:
            if re.search(pattern, lower):
                warning_signs.append(f"Emergency symptom detected: {pattern.strip(r'\\b')}")
                msg = (
                    f"EMERGENCY WARNING: Your reported symptoms indicate a potentially critical condition requiring immediate emergency care. "
                    f"Please immediately call Emergency Services at {self.emergency_hotline} or go to the nearest emergency department. "
                    f"Do not drive yourself."
                )
                if re.search(r"\bsuicid(e|al)|kill myself|end my life\b", lower):
                    msg += f" For urgent emotional crisis support, call the National Mental Health Helpline (KIRAN) at {self.mental_health_helpline}."
                return SafetyValidationResult(
                    is_safe=True,
                    triage_level=TriageLevel.LEVEL_4_EMERGENCY,
                    is_emergency=True,
                    emergency_message=msg,
                    warning_signs=warning_signs,
                    disclaimer_required=True
                )

        # Check Urgent Level 3
        for pattern in self.URGENT_TRIGGERS:
            if re.search(pattern, lower):
                warning_signs.append(f"Urgent symptom detected: {pattern.strip(r'\\b')}")
                return SafetyValidationResult(
                    is_safe=True,
                    triage_level=TriageLevel.LEVEL_3_URGENT,
                    is_emergency=False,
                    emergency_message=None,
                    warning_signs=warning_signs,
                    disclaimer_required=True
                )

        # Level 2 persistent common symptoms (fever, cough, vomiting, headache)
        if any(term in lower for term in ["fever", "cough", "vomiting", "diarrhoea", "diarrhea", "pain", "swelling"]):
            return SafetyValidationResult(
                is_safe=True,
                triage_level=TriageLevel.LEVEL_2_ASSESSMENT,
                is_emergency=False,
                emergency_message=None,
                warning_signs=["Monitor for worsening symptoms or high temperature"],
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

    def validate_ai_response(self, response_text: str) -> Tuple[bool, str]:
        """Verify the generated AI response does not prescribe medication or claim diagnosis."""
        lower = response_text.lower()

        # Check for illegal prescriptions
        for pattern in self.PRESCRIPTION_PATTERNS:
            if re.search(pattern, lower):
                sanitized = re.sub(
                    pattern,
                    "discuss appropriate medication and dosing with your attending physician",
                    response_text,
                    flags=re.IGNORECASE
                )
                return True, sanitized + f"\n\n*Note: Medications must be formally prescribed by a registered healthcare provider.*"

        # Check for absolute diagnostic claims
        for pattern in self.DIAGNOSIS_CLAIM_PATTERNS:
            if re.search(pattern, lower):
                sanitized = re.sub(
                    pattern,
                    "the clinical presentation may suggest possibilities such as",
                    response_text,
                    flags=re.IGNORECASE
                )
                return True, sanitized

        return True, response_text

safety_validator = MedicalSafetyValidator(country_code="IN")
