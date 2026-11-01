"""
Medicus Care™ — AI General Physician Module
Handles symptom intake, duration, severity scoring, red flag detection, and clinical summary generation.
"""

from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

class SymptomIntakeRecord(BaseModel):
    primary_complaint: str
    duration_days: Optional[float] = None
    severity_scale: Optional[int] = None # 1-10
    associated_symptoms: List[str] = []
    preexisting_conditions: List[str] = []
    current_medications: List[str] = []

class ConsultationSummary(BaseModel):
    consultation_id: str
    date: str
    doctor_name: str
    triage_level: int
    reported_symptoms: List[str]
    possible_differential_causes: List[str]
    warning_signs: List[str]
    recommended_actions: List[str]
    formal_referral: str
    disclaimer: str

class GeneralPhysicianEngine:
    COMMON_SYMPTOM_MAP = {
        "fever": {
            "differentials": ["Viral upper respiratory tract infection", "Acute pharyngitis", "Seasonal influenza", "Gastroenteritis"],
            "red_flags": ["Temperature exceeding 103°F (39.4°C)", "Neck stiffness or photophobia", "Severe shortness of breath", "Rash spreading rapidly"],
            "supportive_care": ["Maintain adequate oral fluid intake (water, oral rehydration salts, soups)", "Adequate rest in a cool, ventilated room", "Monitor temperature every 4-6 hours"]
        },
        "cough": {
            "differentials": ["Acute bronchitis", "Allergic rhinitis with post-nasal drip", "Viral pharyngitis", "Gastroesophageal reflux"],
            "red_flags": ["Hemoptysis (coughing blood)", "Stridor or wheezing at rest", "Chest heaviness or pleuritic pain"],
            "supportive_care": ["Warm saline gargles twice daily", "Hydration and steam inhalation", "Avoid dry and dusty environments"]
        },
        "headache": {
            "differentials": ["Tension-type headache", "Dehydration headache", "Cervicogenic strain", "Migraine without aura"],
            "red_flags": ["Thunderclap headache (sudden severe onset)", "Focal neurological deficit or limb weakness", "Confusion or fever with neck rigidity"],
            "supportive_care": ["Rest in a dim, quiet room", "Drink 500-750ml of water immediately", "Reduce digital screen exposure"]
        },
        "indigestion": {
            "differentials": ["Gastroesophageal reflux (GERD)", "Functional dyspepsia", "Dietary indiscretion", "Gastritis"],
            "red_flags": ["Difficulty or pain when swallowing", "Persistent vomiting or coffee-ground emesis", "Black tarry stools (melena)", "Unexplained weight loss"],
            "supportive_care": ["Avoid lying down within 2-3 hours after meals", "Eat smaller, more frequent meals", "Limit spicy, acidic, or caffeinated triggers"]
        }
    }

    def generate_consultation_summary(
        self,
        intake: SymptomIntakeRecord,
        triage_level: int = 1
    ) -> ConsultationSummary:
        now = datetime.now()
        complaint_lower = intake.primary_complaint.lower()
        
        differentials = ["Clinical evaluation required for differential assessment"]
        red_flags = ["Sudden onset of severe pain", "Difficulty breathing or chest tightness"]
        care_steps = ["Schedule consultation with a registered medical practitioner", "Maintain adequate hydration and rest"]

        for key, data in self.COMMON_SYMPTOM_MAP.items():
            if key in complaint_lower:
                differentials = data["differentials"]
                red_flags = data["red_flags"]
                care_steps = data["supportive_care"] + ["Consult a physician if symptoms persist beyond 48 hours"]
                break

        return ConsultationSummary(
            consultation_id=f"MC-{now.strftime('%Y%m%d%H%M')}-{int(now.timestamp()) % 10000}",
            date=now.strftime("%d %B %Y, %I:%M %p"),
            doctor_name="Dr. Arjun, M.D. (AI Doctor)",
            triage_level=triage_level,
            reported_symptoms=[intake.primary_complaint] + intake.associated_symptoms,
            possible_differential_causes=differentials,
            warning_signs=red_flags,
            recommended_actions=care_steps,
            formal_referral="Formal physical examination by a licensed General Physician is advised for clinical diagnosis and treatment planning.",
            disclaimer=(
                "Medicus Care™ is an AI digital healthcare assistant. This summary is intended for educational and "
                "record-keeping purposes only. It is not an official medical prescription or definitive diagnosis."
            )
        )

general_physician_engine = GeneralPhysicianEngine()
