"""Keep production smoke coverage aligned with the two bundled doctor avatars."""

from app.api.v1.doctors import DOCTORS
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
