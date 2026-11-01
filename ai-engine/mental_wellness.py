"""
Medicus Care™ — AI Mental Wellness Module
Provides supportive non-clinical conversations, guided box-breathing, sleep hygiene, and crisis escalation.
"""

from typing import Dict, Any, List, Optional
import re
from pydantic import BaseModel

class BreathingSession(BaseModel):
    title: str = "4-4-4 Box Breathing Exercise"
    inhale_seconds: int = 4
    hold_seconds: int = 4
    exhale_seconds: int = 4
    cycles: int = 4
    guidance: List[str] = [
        "Find a comfortable seated position with your back straight and shoulders relaxed.",
        "Inhale gently and deeply through your nose for 4 seconds...",
        "Hold your breath calmly for 4 seconds...",
        "Exhale slowly and smoothly through your mouth for 4 seconds...",
        "Pause and reset. Repeat for 4 calming cycles."
    ]

class MentalWellnessEngine:
    CRISIS_KEYWORDS = [
        r"\b(suicid|kill myself|end it all|can't go on|want to die|self[- ]harm)\b"
    ]

    STRESS_AREAS = {
        "work": "Workplace demands, deadline fatigue, and occupational burnout.",
        "academic": "Examination anxiety, competitive grading pressures, and study fatigue.",
        "sleep": "Sleep hygiene disturbances, racing thoughts at bedtime, and insomnia patterns.",
        "loneliness": "Feelings of isolation, social disconnection, and needing a compassionate listening ear."
    }

    def check_crisis(self, text: str) -> Optional[Dict[str, str]]:
        lower = text.lower()
        for pattern in self.CRISIS_KEYWORDS:
            if re.search(pattern, lower):
                return {
                    "is_crisis": True,
                    "escalation_message": (
                        "I hear how much pain you are experiencing right now, and you do not have to carry this alone. "
                        "Please reach out immediately to trained professionals who care and can support you right this second:\n\n"
                        "• Emergency Services (India): Call 112\n"
                        "• National Mental Health Helpline (KIRAN): Call 1800-599-0019 (24/7, Toll-Free)\n"
                        "• Vandrevala Foundation Helpline: Call 9999 666 555 (24/7)\n"
                        "• Tele-MANAS Helpline: Call 14416 or 1800 891 4416\n\n"
                        "Please reach out to a trusted loved one, doctor, or counselor right away."
                    )
                }
        return None

    def get_guided_breathing(self) -> BreathingSession:
        return BreathingSession()

mental_wellness_engine = MentalWellnessEngine()
