"""Keep production smoke coverage aligned with the two bundled doctor avatars."""

from app.api.v1.doctors import DOCTORS
from app.services.ananya_prompt import ANANYA_SYSTEM_PROMPT
from smoke_test_doctor_lipsync import DOCTOR_CASES, PROJECT_ROOT


def test_both_bundled_doctor_portraits_are_shipped():
    assert set(DOCTORS) == {"dr_ananya", "dr_arjun"}
    for profile in DOCTORS.values():
        assert profile["image"].is_file()


def test_deployment_smoke_checks_both_gendered_tts_paths():
    cases = {doctor_id: voice_gender for doctor_id, _, voice_gender, _ in DOCTOR_CASES}
    assert cases == {"dr_ananya": "female", "dr_arjun": "male"}
    assert PROJECT_ROOT.joinpath("frontend", "public", "doctor", "dr_ananya.jpg").is_file()
    assert PROJECT_ROOT.joinpath("frontend", "public", "doctor", "dr_arjun.jpg").is_file()


def test_ananya_prompt_enforces_companion_role_and_safety_boundaries():
    assert "AI Mental Wellness Companion" in ANANYA_SYSTEM_PROMPT
    assert "Never diagnose mental-health disorders" in ANANYA_SYSTEM_PROMPT
    assert "emergency number 112" in ANANYA_SYSTEM_PROMPT
    assert "Never provide self-harm instructions or methods" in ANANYA_SYSTEM_PROMPT
    assert "source book, chapter, and page attribution" in ANANYA_SYSTEM_PROMPT
