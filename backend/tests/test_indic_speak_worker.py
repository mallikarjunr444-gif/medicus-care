"""Audio-format and voice-map tests for the separate local TTS worker."""

import io

import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from indic_speak_service import main as worker
from indic_speak_service.main import _wave_to_wav, speaker_for


@pytest.mark.parametrize(
    ("language", "gender", "speaker"),
    [
        ("hi", "male", "Amit"),
        ("hi", "female", "Kavya"),
        ("kn", "male", "Adarsh"),
        ("kn", "female", "Deepika"),
    ],
)
def test_voice_route(language, gender, speaker):
    assert speaker_for(language, gender) == speaker


def test_waveform_is_encoded_as_valid_24khz_mono_pcm_wav():
    wav = _wave_to_wav(np.sin(np.linspace(0, 30, 4800, dtype=np.float32)) * 0.2)
    info = sf.info(io.BytesIO(wav))

    assert info.format == "WAV"
    assert info.subtype == "PCM_16"
    assert info.samplerate == 24000
    assert info.channels == 1
    assert info.frames == 4800


def test_silent_or_non_finite_waveforms_are_rejected():
    with pytest.raises(ValueError, match="silent"):
        _wave_to_wav(np.zeros(2400, dtype=np.float32))
    with pytest.raises(ValueError, match="non-finite"):
        _wave_to_wav(np.array([0.1, np.nan], dtype=np.float32))


def test_synthesis_endpoint_passes_native_text_and_selected_speaker(monkeypatch):
    captured = {}

    class FakeModel:
        def __call__(self, text, speaker):
            captured["text"] = text
            captured["speaker"] = speaker
            return np.full(2400, 0.15, dtype=np.float32)

    monkeypatch.setattr(worker, "_load_model", lambda: FakeModel())
    text = "ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು."

    with TestClient(worker.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": text, "language": "kn", "voice_gender": "male"},
        )

    assert response.status_code == 200
    assert response.headers["x-audio-sample-rate"] == "24000"
    assert response.headers["x-tts-speaker"] == "Adarsh"
    assert captured == {"text": text, "speaker": "Adarsh"}
    info = sf.info(io.BytesIO(response.content))
    assert info.samplerate == 24000
    assert info.channels == 1
    assert info.frames > 0
