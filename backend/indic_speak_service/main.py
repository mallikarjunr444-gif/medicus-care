"""Local-only Indic-Speak inference worker for Hindi and Kannada.

Install this service into its own environment with
`requirements-indic-speak.txt`; do not install its Transformers/Torch versions
into the MuseTalk backend environment.
"""

from __future__ import annotations

import asyncio
import importlib.util
import io
import logging
import os
import sys
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from huggingface_hub import snapshot_download
from pydantic import BaseModel, Field

logger = logging.getLogger("indic_speak_service")

MODEL_ID = os.getenv("INDIC_SPEAK_MODEL_ID", "bodhan-ai/indic-speak-preview-v2")
MODEL_REVISION = os.getenv("INDIC_SPEAK_REVISION", "76e0814f189321efe550011850cd288dae366aad")
SAMPLE_RATE = 24000
SPEAKERS = {
    "hi": {"male": "Amit", "female": "Kavya"},
    "kn": {"male": "Adarsh", "female": "Deepika"},
}

_model = None
_model_lock = threading.Lock()
_inference_lock = threading.Lock()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Load once before the service accepts requests so the first patient turn
    # does not wait for a multi-GB download/model initialization.
    await asyncio.to_thread(_load_model)
    yield


app = FastAPI(
    title="Local Indic-Speak TTS",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    language: Literal["hi", "kn"]
    voice_gender: Literal["male", "female"]


def speaker_for(language: str, voice_gender: str) -> str:
    """Resolve only the documented native-language speaker names."""
    try:
        return SPEAKERS[language][voice_gender]
    except KeyError as exc:
        raise ValueError("Indic-Speak supports only Hindi and Kannada voice routes.") from exc


def _load_model():
    """Download the gated model once, then load its documented inference API."""
    global _model
    if _model is not None:
        return _model

    with _model_lock:
        if _model is not None:
            return _model

        try:
            snapshot = Path(snapshot_download(repo_id=MODEL_ID, revision=MODEL_REVISION))
        except Exception as exc:
            logger.exception("Could not download the gated Indic-Speak model")
            raise RuntimeError(
                "Indic-Speak model access is unavailable. Accept the model terms on Hugging Face, "
                "run `hf auth login`, and retry. The model is downloaded once into the local cache."
            ) from exc

        inference_file = snapshot / "inference.py"
        if not inference_file.is_file():
            raise RuntimeError(f"The approved model snapshot has no inference.py: {snapshot}")

        # The repository contains the documented inference implementation and
        # its Vocos helpers. Keep that snapshot ahead of unrelated site packages.
        snapshot_str = str(snapshot)
        if snapshot_str not in sys.path:
            sys.path.insert(0, snapshot_str)
        module_name = "_indic_speak_official_inference"
        spec = importlib.util.spec_from_file_location(module_name, inference_file)
        if spec is None or spec.loader is None:
            raise RuntimeError("Could not load the official Indic-Speak inference module.")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)

        # The model card documents TTS(model_id_or_local_directory), with the
        # waveform returned as float32 NumPy data at 24 kHz.
        _model = module.TTS(snapshot_str)
        logger.info("Indic-Speak loaded from %s", MODEL_ID)
        return _model


def _wave_to_wav(waveform) -> bytes:
    samples = np.asarray(waveform, dtype=np.float32).squeeze()
    if samples.ndim != 1 or samples.size == 0:
        raise ValueError("Indic-Speak returned empty or non-mono waveform data.")
    if not np.isfinite(samples).all():
        raise ValueError("Indic-Speak returned non-finite waveform samples.")

    peak = float(np.max(np.abs(samples)))
    if peak <= 1e-7:
        raise ValueError("Indic-Speak returned silent audio.")
    if peak > 1.0:
        samples = samples / peak

    output = io.BytesIO()
    sf.write(output, samples, SAMPLE_RATE, format="WAV", subtype="PCM_16")
    wav_bytes = output.getvalue()
    info = sf.info(io.BytesIO(wav_bytes))
    if info.samplerate != SAMPLE_RATE or info.channels != 1 or info.frames <= 0:
        raise ValueError("Could not encode a valid 24 kHz mono WAV from Indic-Speak output.")
    return wav_bytes


def _synthesize(text: str, language: str, voice_gender: str) -> tuple[bytes, str]:
    speaker = speaker_for(language, voice_gender)
    model = _load_model()
    # Serialize generation: the Mac has 16 GB unified memory and one model
    # instance; concurrent requests should not compete for that memory.
    with _inference_lock:
        waveform = model(text, speaker=speaker)
    return _wave_to_wav(waveform), speaker


@app.get("/health")
async def health():
    return {
        "status": "ready" if _model is not None else "model_not_loaded",
        "model": MODEL_ID,
        "revision": MODEL_REVISION,
        "model_loaded": _model is not None,
        "languages": ["hi", "kn"],
        "sample_rate": SAMPLE_RATE,
    }


@app.post("/synthesize")
async def synthesize(request: SynthesisRequest):
    if "\ufffd" in request.text:
        raise HTTPException(
            status_code=422, detail="Text contains a Unicode replacement character."
        )

    try:
        wav_bytes, speaker = await asyncio.to_thread(
            _synthesize,
            request.text,
            request.language,
            request.voice_gender,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Indic-Speak synthesis failed for language=%s", request.language)
        raise HTTPException(
            status_code=503,
            detail="Local Indic-Speak is unavailable; check model access and worker logs.",
        ) from exc

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "X-Audio-Sample-Rate": str(SAMPLE_RATE),
            "X-Audio-Channels": "1",
            "X-TTS-Model": MODEL_ID,
            "X-TTS-Speaker": speaker,
        },
    )
