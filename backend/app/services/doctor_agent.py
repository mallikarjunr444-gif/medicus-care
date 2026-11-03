"""
Medicus Care™ — Interactive Doctor Agent & Controlled Tool Calling Engine
Connects Dr. Smit, M.D. and Dr. Ananya, M.D. to controlled healthcare application tools.
Requires explicit patient consent before executing sensitive or external actions.
"""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("medicus_care.doctor_agent")

# ── Data Models ─────────────────────────────────────────────────────────────

class DoctorToolCall(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]
    requires_confirmation: bool = False
    confirmation_prompt: Optional[str] = None

class SpecialistDoctor(BaseModel):
    id: str
    name: str
    specialty: str
    qualification: str
    hospital: str
    location: str
    district: str
    state: str
    available_days: List[str]
    consultation_type: str  # 'In-Person' | 'Telemedicine'
    contact_phone: Optional[str] = None

class AppointmentRequest(BaseModel):
    patient_id: str
    doctor_id: str
    doctor_name: str
    specialty: str
    preferred_date: str
    preferred_time_slot: str
    reason_for_visit: str
    confirmed_by_patient: bool = False

class ConsultationNote(BaseModel):
    consultation_id: str
    patient_id: str
    doctor_id: str
    timestamp: str
    chief_complaint: str
    symptoms: List[str]
    differential_possibilities: List[str]
    lifestyle_recommendations: List[str]
    warning_signs: List[str]
    approved_by_patient: bool = False

class LabReportAnalysis(BaseModel):
    report_title: str
    parameters_analyzed: List[Dict[str, Any]]
    preliminary_explanation: str
    clinical_limitations: str
    recommended_doctor_review: str

# ── Localized Specialists Directory (Karnataka / Chikkamagaluru & National) ──

VERIFIED_SPECIALISTS: List[SpecialistDoctor] = [
    SpecialistDoctor(
        id="DOC-CKM-01",
        name="Dr. Srinivas Murthy, M.D.",
        specialty="General Medicine / Internal Medicine",
        qualification="MBBS, MD (General Medicine)",
        hospital="District Hospital Chikkamagaluru",
        location="MG Road, Chikkamagaluru",
        district="Chikkamagaluru",
        state="Karnataka",
        available_days=["Monday", "Wednesday", "Friday", "Saturday"],
        consultation_type="In-Person",
        contact_phone="+91 8262 230230"
    ),
    SpecialistDoctor(
        id="DOC-CKM-02",
        name="Dr. Rashmi Gowda, M.D.",
        specialty="Pulmonology & Respiratory Medicine",
        qualification="MBBS, MD (Pulmonary Medicine)",
        hospital="Chikkamagaluru Medical Sciences Hospital",
        location="Kadur Road, Chikkamagaluru",
        district="Chikkamagaluru",
        state="Karnataka",
        available_days=["Tuesday", "Thursday", "Saturday"],
        consultation_type="In-Person",
        contact_phone="+91 8262 245100"
    ),
    SpecialistDoctor(
        id="DOC-CKM-03",
        name="Dr. Pradeep Kumar, D.P.M.",
        specialty="Clinical Psychiatry & Mental Health",
        qualification="MBBS, DPM, MD (Psychiatry)",
        hospital="District Mental Health Clinic & De-Addiction Centre",
        location="Indira Gandhi Road, Chikkamagaluru",
        district="Chikkamagaluru",
        state="Karnataka",
        available_days=["Monday", "Tuesday", "Thursday"],
        consultation_type="In-Person & Telemedicine",
        contact_phone="+91 8262 235544"
    ),
    SpecialistDoctor(
        id="DOC-BLR-01",
        name="Dr. K. Ananth, M.D., DM",
        specialty="Cardiology & Cardiovascular Sciences",
        qualification="MBBS, MD, DM (Cardiology)",
        hospital="Sri Jayadeva Institute of Cardiovascular Sciences",
        location="Bannerghatta Road, Bengaluru",
        district="Bengaluru Urban",
        state="Karnataka",
        available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        consultation_type="In-Person & Telemedicine",
        contact_phone="+91 80 2297 7400"
    ),
    SpecialistDoctor(
        id="DOC-MYS-01",
        name="Dr. Kavitha Hegde, M.D.",
        specialty="Endocrinology & Diabetology",
        qualification="MBBS, MD, DNB (Endocrinology)",
        hospital="K.R. Hospital & Mysore Medical College",
        location="Irwin Road, Mysuru",
        district="Mysuru",
        state="Karnataka",
        available_days=["Monday", "Wednesday", "Thursday"],
        consultation_type="In-Person & Telemedicine",
        contact_phone="+91 821 242 0100"
    ),
]

# ── Doctor Agent Orchestrator Class ─────────────────────────────────────────

class DoctorAgentOrchestrator:
    """
    Orchestrates intelligent action detection, tool execution, patient permissions,
    and automatic language detection for the AI Doctor.
    """

    def __init__(self):
        self.specialists = VERIFIED_SPECIALISTS

    def detect_language(self, text: str) -> str:
        """
        Detect whether input is in Kannada, Hindi, or English.
        Uses Unicode script range heuristics for zero-latency local detection.
        """
        kannada_chars = len(re.findall(r"[\u0C80-\u0CFF]", text))
        hindi_chars = len(re.findall(r"[\u0900-\u097F]", text))
        total_len = max(len(text.strip()), 1)

        if kannada_chars / total_len > 0.15:
            return "kn"
        elif hindi_chars / total_len > 0.15:
            return "hi"
        return "en"

    def detect_tool_intent(self, user_message: str, current_mode: str = "general_physician") -> Optional[DoctorToolCall]:
        """
        Analyze user message to detect if an application tool action should be triggered.
        """
        lower = user_message.lower()

        # 1. Specialist Search Intent
        if any(k in lower for k in ["find doctor", "find a doctor", "specialist near me", "search doctor", "cardiologist", "pulmonologist", "psychiatrist", "hospital in chikkamagaluru", "hospital near me"]):
            specialty = "General Medicine"
            if "heart" in lower or "cardio" in lower:
                specialty = "Cardiology"
            elif "lung" in lower or "breath" in lower or "pulmono" in lower or "cough" in lower:
                specialty = "Pulmonology"
            elif "mental" in lower or "stress" in lower or "anxiety" in lower or "psychiat" in lower or "therapist" in lower:
                specialty = "Psychiatry"
            
            return DoctorToolCall(
                tool_name="search_specialists",
                parameters={"specialty": specialty, "district": "Chikkamagaluru", "state": "Karnataka"},
                requires_confirmation=False
            )

        # 2. Appointment Booking Intent
        if any(k in lower for k in ["book appointment", "schedule visit", "book a visit", "consult in person", "schedule appointment"]):
            return DoctorToolCall(
                tool_name="request_appointment",
                parameters={"preferred_time": "Morning (10:00 AM - 1:00 PM)", "confirmed": False},
                requires_confirmation=True,
                confirmation_prompt="Would you like me to prepare an appointment request with an attending physician? Please confirm your preferred date and time."
            )

        # 3. Medical Report Interpretation Intent
        if any(k in lower for k in ["interpret report", "analyze report", "read my report", "blood test result", "cbc result", "hba1c"]):
            return DoctorToolCall(
                tool_name="interpret_medical_report",
                parameters={"report_type": "Blood Panel / CBC / Metabolic"},
                requires_confirmation=False
            )

        # 4. Save Consultation Notes Intent
        if any(k in lower for k in ["save notes", "save summary", "download summary", "record this visit", "save consultation"]):
            return DoctorToolCall(
                tool_name="save_consultation_notes",
                parameters={"patient_approved": True},
                requires_confirmation=True,
                confirmation_prompt="Shall I compile and save your formal consultation summary notes to your secure patient profile?"
            )

        # 5. Health Reminder Intent
        if any(k in lower for k in ["remind me", "set reminder", "set a reminder to drink water", "temperature reminder"]):
            return DoctorToolCall(
                tool_name="create_health_reminder",
                parameters={"reminder_text": user_message},
                requires_confirmation=True,
                confirmation_prompt="Would you like me to set a health reminder for this schedule?"
            )

        # 6. Mode Switch Intent
        if any(k in lower for k in ["switch to mental wellness", "switch to psychologist", "talk to therapist", "switch to dr ananya"]):
            return DoctorToolCall(
                tool_name="switch_consultation_mode",
                parameters={"target_mode": "mental_wellness", "target_doctor": "dr_ananya"},
                requires_confirmation=False
            )
        elif any(k in lower for k in ["switch to general physician", "switch to dr smit", "switch to physician", "medical doctor"]):
            return DoctorToolCall(
                tool_name="switch_consultation_mode",
                parameters={"target_mode": "general_physician", "target_doctor": "dr_arjun"},
                requires_confirmation=False
            )

        # 7. Language Switch Intent
        if any(k in lower for k in ["speak in kannada", "kannada please", "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ"]):
            return DoctorToolCall(
                tool_name="switch_language",
                parameters={"language": "kn"},
                requires_confirmation=False
            )
        elif any(k in lower for k in ["speak in hindi", "hindi please", "हिंदी में बात करें"]):
            return DoctorToolCall(
                tool_name="switch_language",
                parameters={"language": "hi"},
                requires_confirmation=False
            )
        elif any(k in lower for k in ["speak in english", "english please"]):
            return DoctorToolCall(
                tool_name="switch_language",
                parameters={"language": "en"},
                requires_confirmation=False
            )

        return None

    def execute_tool(self, tool_call: DoctorToolCall) -> Dict[str, Any]:
        """Execute the detected tool safely and return structured context."""
        name = tool_call.tool_name
        params = tool_call.parameters

        if name == "search_specialists":
            specialty_query = params.get("specialty", "").lower()
            matches = [
                doc.dict() for doc in self.specialists
                if specialty_query in doc.specialty.lower() or specialty_query in doc.name.lower()
            ]
            if not matches:
                matches = [doc.dict() for doc in self.specialists[:3]]
            return {
                "status": "success",
                "tool": name,
                "count": len(matches),
                "location": "Chikkamagaluru & Karnataka Regional Healthcare Network",
                "specialists": matches,
                "action_type": "display_specialist_cards"
            }

        elif name == "request_appointment":
            return {
                "status": "pending_confirmation",
                "tool": name,
                "message": "Appointment request formulated. Awaiting explicit patient review.",
                "action_type": "open_appointment_dialog",
                "draft": {
                    "preferred_time": params.get("preferred_time", "10:00 AM"),
                    "location": "District Hospital Chikkamagaluru"
                }
            }

        elif name == "interpret_medical_report":
            return {
                "status": "success",
                "tool": name,
                "action_type": "open_report_drawer",
                "supported_panels": ["Complete Blood Count (CBC)", "Fasting Blood Sugar & HbA1c", "Thyroid Profile (TSH)", "Lipid Profile"],
                "disclaimer": "Diagnostic parameter extraction is an educational reference check and must be correlated with your attending physician."
            }

        elif name == "save_consultation_notes":
            return {
                "status": "ready_for_export",
                "tool": name,
                "action_type": "open_summary_modal",
                "message": "Consultation summary ready for patient review and export."
            }

        elif name == "switch_consultation_mode":
            return {
                "status": "success",
                "tool": name,
                "action_type": "switch_doctor",
                "target_mode": params.get("target_mode"),
                "target_doctor": params.get("target_doctor")
            }

        elif name == "switch_language":
            return {
                "status": "success",
                "tool": name,
                "action_type": "change_language",
                "language": params.get("language")
            }

        return {"status": "unsupported", "tool": name}

doctor_agent_orchestrator = DoctorAgentOrchestrator()
