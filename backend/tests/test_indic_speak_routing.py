"""Language routing and WAV contract tests for local Indic-Speak TTS."""

import io
from types import SimpleNamespace
from unittest.mock import AsyncMock

import numpy as np
import pytest
import soundfile

from app.services import tts as tts_module
from app.services.gnani_service import gnani_service
from app.services.tts import SynthResult, TTSService

pytestmark = pytest.mark.asyncio


def _wav_bytes(sample_rate: int = 24000, frames: int = 4800, channels: int = 1) -> bytes:
    audio = np.full((frames, channels) if channels > 1 else frames, 0.1, dtype=np.float32)
    output = io.BytesIO()
    soundfile.write(output, audio, sample_rate, format="WAV", subtype="PCM_16")
    return output.getvalue()


@pytest.mark.parametrize(
    ("language", "text", "gender"),
    [
        ("hi-IN", "नमस्ते, मैं आपका डॉक्टर हूँ।", "male"),
        ("kn", "ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು.", "female"),
    ],
)
async def test_hindi_and_kannada_route_to_indic_speak_before_provider_fallbacks(
    monkeypatch, tmp_path, language, text, gender
):
    service = TTSService()
    result = SynthResult(str(tmp_path / "speech.wav"), "indic-speak", False, False)
    local_model = AsyncMock(return_value=result)
    edge = AsyncMock()
    monkeypatch.setattr(service, "_indic_speak", local_model)
    monkeypatch.setattr(service, "_edge_fallback", edge)

    actual = await service.synthesize(
        text, str(tmp_path / "speech.wav"), language=language, voice_gender=gender
    )

    assert actual.engine == "indic-speak"
    local_model.assert_awaited_once_with(
        text=text,
        output_path=str(tmp_path / "speech.wav"),
        language=language.split("-")[0],
        voice_gender=gender,
    )
    edge.assert_not_awaited()


async def test_indic_speak_client_writes_only_valid_24khz_mono_wav(monkeypatch, tmp_path):
    wav = _wav_bytes()
    monkeypatch.setattr(tts_module.settings, "INDIC_SPEAK_URL", "http://127.0.0.1:8001/")

    class FakeClient:
        def __init__(self, timeout):
            assert timeout.connect == 5.0

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url, json):
            assert url == "http://127.0.0.1:8001/synthesize"
            assert json == {
                "text": "ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು.",
                "language": "kn",
                "voice_gender": "male",
            }
            return SimpleNamespace(status_code=200, content=wav)

    monkeypatch.setattr(tts_module.httpx, "AsyncClient", FakeClient)
    service = TTSService()
    output = tmp_path / "kn.wav"

    result = await service._indic_speak("ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು.", str(output), "kn", "male")

    info = soundfile.info(output)
    assert result.engine == "indic-speak"
    assert result.fallback is False
    assert output.read_bytes() == wav
    assert (info.format, info.samplerate, info.channels, info.frames) == (
        "WAV",
        24000,
        1,
        4800,
    )


async def test_invalid_indic_speak_audio_is_rejected(monkeypatch, tmp_path):
    monkeypatch.setattr(tts_module.settings, "INDIC_SPEAK_URL", "http://127.0.0.1:8001")

    class FakeClient:
        def __init__(self, timeout):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return SimpleNamespace(status_code=200, content=_wav_bytes(sample_rate=16000))

    monkeypatch.setattr(tts_module.httpx, "AsyncClient", FakeClient)
    output = tmp_path / "bad.wav"

    with pytest.raises(ValueError, match="24 kHz"):
        await TTSService()._indic_speak("नमस्ते", str(output), "hi", "female")

    assert not output.exists()


async def test_corrupted_unicode_is_rejected_without_fallback(monkeypatch, tmp_path):
    service = TTSService()
    edge = AsyncMock()
    monkeypatch.setattr(service, "_edge_fallback", edge)

    with pytest.raises(ValueError, match="corrupted Unicode"):
        await service.synthesize("ಕನ್ನಡ\ufffd", str(tmp_path / "bad.wav"), language="kn")

    edge.assert_not_awaited()


async def test_worker_failure_does_not_fall_back_to_edge_or_gnani(monkeypatch, tmp_path):
    class FailedClient:
        def __init__(self, timeout):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return SimpleNamespace(status_code=503, content=b"worker unavailable")

    monkeypatch.setattr(tts_module.httpx, "AsyncClient", FailedClient)
    service = TTSService()
    edge = AsyncMock()
    gnani = AsyncMock()
    monkeypatch.setattr(service, "_edge_fallback", edge)
    monkeypatch.setattr(gnani_service, "synthesize", gnani)

    result = await service.synthesize(
        "नमस्ते", str(tmp_path / "hi.wav"), language="hi", voice_gender="male"
    )

    assert result.engine == "edge-tts"
    assert result.fallback is True
    edge.assert_awaited_once_with("नमस्ते", str(tmp_path / "hi.wav"), "hi", "male")
    gnani.assert_not_awaited()


async def test_hindi_kannada_use_gtts_when_indic_speak_and_edge_both_fail(monkeypatch, tmp_path):
    service = TTSService()
    monkeypatch.setattr(service, "_indic_speak", AsyncMock(side_effect=RuntimeError("down")))
    monkeypatch.setattr(service, "_edge_fallback", AsyncMock(side_effect=RuntimeError("offline")))
    gtts = AsyncMock()
    monkeypatch.setattr(service, "_gtts_fallback", gtts)

    result = await service.synthesize("ನಮಸ್ಕಾರ", str(tmp_path / "kn.wav"), language="kn")

    assert result.engine == "gtts"
    gtts.assert_awaited_once_with("ನಮಸ್ಕಾರ", str(tmp_path / "kn.wav"), "kn")


async def test_english_keeps_the_existing_male_voice_route(monkeypatch, tmp_path):
    service = TTSService()
    edge = AsyncMock(return_value=str(tmp_path / "en.wav"))
    local_model = AsyncMock()
    monkeypatch.setattr(service, "_edge_fallback", edge)
    monkeypatch.setattr(service, "_indic_speak", local_model)

    result = await service.synthesize(
        "Hello, I am your doctor.",
        str(tmp_path / "en.wav"),
        language="en",
        voice_gender="male",
    )

    assert result.engine == "edge-tts"
    edge.assert_awaited_once()
    local_model.assert_not_awaited()
