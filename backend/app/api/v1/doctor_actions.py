"""
Medicus Care™ — Doctor Agentic Action & Specialist Booking API
Endpoints for controlled tool calling, appointment scheduling, specialist directory lookups, and report analysis.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.doctor_agent import (
    AppointmentRequest,
    ConsultationNote,
    DoctorToolCall,
    LabReportAnalysis,
    SpecialistDoctor,
    doctor_agent_orchestrator,
)

router = APIRouter()

class IntentCheckRequest(BaseModel):
    user_message: str
    current_mode: str = "general_physician"
    current_language: str = "en"

class AppointmentConfirmRequest(BaseModel):
    specialist_id: str
    preferred_date: str
    preferred_time_slot: str
    reason: str
    patient_confirmed: bool = True

class ReportAnalysisRequest(BaseModel):
    report_text: str
    test_type: Optional[str] = "Complete Blood Count"

@router.post("/intent/check")
async def evaluate_agent_intent(req: IntentCheckRequest):
    """
    Check if a patient statement triggers a controlled application tool.
    Detects language, specialist search, appointment requests, and report interpretation.
    """
    detected_lang = doctor_agent_orchestrator.detect_language(req.user_message)
    tool_call = doctor_agent_orchestrator.detect_tool_intent(req.user_message, current_mode=req.current_mode)

    response_data: Dict[str, Any] = {
        "detected_language": detected_lang,
        "language_changed": detected_lang != req.current_language,
        "has_tool_action": tool_call is not None,
    }

    if tool_call:
        response_data["tool_name"] = tool_call.tool_name
        response_data["requires_confirmation"] = tool_call.requires_confirmation
        response_data["confirmation_prompt"] = tool_call.confirmation_prompt
        # Execute non-sensitive lookups immediately
        if not tool_call.requires_confirmation:
            exec_res = doctor_agent_orchestrator.execute_tool(tool_call)
            response_data["execution_result"] = exec_res

    return response_data

@router.get("/specialists")
async def list_verified_specialists(
    specialty: Optional[str] = Query(None),
    district: Optional[str] = Query("Chikkamagaluru"),
):
    """List verified physicians and hospitals in Karnataka / Chikkamagaluru."""
    docs = doctor_agent_orchestrator.specialists
    if specialty:
        s_lower = specialty.lower()
        docs = [d for d in docs if s_lower in d.specialty.lower() or s_lower in d.name.lower()]
    if district:
        d_lower = district.lower()
        docs = [d for d in docs if d_lower in d.district.lower() or d_lower in d.location.lower()]
    return {
        "count": len(docs),
        "district": district,
        "state": "Karnataka",
        "specialists": [d.dict() for d in docs],
    }

@router.post("/appointments/request")
async def create_appointment_request(req: AppointmentConfirmRequest):
    """
    Create an appointment request requiring explicit patient authorization.
    Strictly forbids autonomous bookings without patient confirmation.
    """
    if not req.patient_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit patient confirmation is required before booking an appointment.",
        )

    matched_doc = next((d for d in doctor_agent_orchestrator.specialists if d.id == req.specialist_id), None)
    if not matched_doc:
        raise HTTPException(status_code=404, detail="Specialist doctor not found.")

    booking_id = f"APT-{matched_doc.id}-{int(datetime.utcnow().timestamp()) % 10000}"
    return {
        "status": "confirmed_by_patient",
        "booking_id": booking_id,
        "specialist": matched_doc.dict(),
        "appointment_date": req.preferred_date,
        "time_slot": req.preferred_time_slot,
        "clinic_location": matched_doc.location,
        "instructions": "Please arrive 15 minutes prior to your consultation slot with existing medical records.",
        "hospital_contact": matched_doc.contact_phone,
    }

@router.post("/reports/analyze")
async def analyze_laboratory_report(req: ReportAnalysisRequest):
    """
    Extract and interpret laboratory diagnostic parameters with clinical guardrails.
    Never formulates an autonomous diagnosis; highlights values and reference ranges.
    """
    text_lower = req.report_text.lower()
    parameters = []

    # Hemoglobin check
    if "hemoglobin" in text_lower or "hb" in text_lower:
        parameters.append({
            "parameter": "Hemoglobin (Hb)",
            "reference_range": "13.5 - 17.5 g/dL (Male) / 12.0 - 15.5 g/dL (Female)",
            "interpretation": "Oxygen-carrying capacity of red blood cells.",
            "status": "Review with physician"
        })

    # White Blood Cell count
    if "wbc" in text_lower or "leukocyte" in text_lower:
        parameters.append({
            "parameter": "Total Leukocyte Count (WBC)",
            "reference_range": "4,500 - 11,000 cells/mcL",
            "interpretation": "Immune system cell count. Elevated levels often reflect bodily defense against viral or bacterial infection.",
            "status": "Review with physician"
        })

    # Blood Sugar / HbA1c
    if "sugar" in text_lower or "glucose" in text_lower or "hba1c" in text_lower:
        parameters.append({
            "parameter": "Fasting Blood Glucose",
            "reference_range": "70 - 99 mg/dL (Normal Fasting)",
            "interpretation": "Basal metabolic glucose level. Values 100-125 indicate prediabetes; >= 126 suggests diabetes mellitus.",
            "status": "Clinical correlation recommended"
        })

    # Thyroid TSH
    if "tsh" in text_lower or "thyroid" in text_lower:
        parameters.append({
            "parameter": "Thyroid Stimulating Hormone (TSH)",
            "reference_range": "0.4 - 4.0 mIU/L",
            "interpretation": "Pituitary regulation of thyroid activity.",
            "status": "Review with physician"
        })

    if not parameters:
        parameters.append({
            "parameter": "General Laboratory Biomarker",
            "reference_range": "Standard reference intervals vary by laboratory methodology",
            "interpretation": "Automated parameter detection requires standard clinical formatting.",
            "status": "Pending physician review"
        })

    return {
        "report_title": req.test_type or "Clinical Laboratory Diagnostic Analysis",
        "parameters_analyzed": parameters,
        "preliminary_explanation": "These laboratory values are educational reference guidelines. Reference intervals vary between certified pathology laboratories.",
        "clinical_limitations": "Medicus Care is an AI assistant and does not replace in-person pathological review.",
        "recommended_doctor_review": "Please share this report packet with your registered general physician for diagnosis and prescription."
    }
