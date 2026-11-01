"""
Gnani.ai (Vachana) Voice AI integration for Medicus Care.

Provides ultra-low latency, native Indic Speech-to-Text (Prisma v3.0)
and natural Text-to-Speech (Timbre v2.5 / v3.0) across 12+ Indian languages
and Indian-accent English (Hindi, Kannada, Tamil, Telugu, Marathi, etc.).
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import mimetypes
from pathlib import Path
from typing import Any, Dict, Optional, Union
import urllib.error
import urllib.request
import uuid

from app.config import settings

logger = logging.getLogger(__name__)

# Map of ISO 639-1 language codes to recommended Gnani voice profiles
LANGUAGE_VOICE_MAP: Dict[str, str] = {
    "en": "Nalini",   # Professional, empathetic Indian-accent English
    "hi": "Deepak",   # Reassuring Hindi male doctor
    "kn": "Nayana",   # Warm Kannada female specialist
    "ta": "Oviya",    # Tamil specialist
    "te": "Kamakshi", # Telugu specialist
    "mr": "Radhika",  # Marathi specialist
    "bn": "Mehuli",   # Bengali specialist
    "gu": "Falguni",  # Gujarati specialist
    "ml": "Ambuja",   # Malayalam specialist
    "pa": "Jwala",    # Punjabi specialist
}

# Supported Gnani voices catalog
GNANI_VOICES = {
    "Nalini", "Bhavna", "Yashvi", "Urmila", "Jwala", "Chitra", "Ambuja",
    "Deepak", "Roopesh", "Vikrant", "Hemraj", "Jalaj", "Omkar", "Aarohi",
    "Bhavini", "Charvi", "Eishani", "Falguni", "Gauri", "Iravati", "Janaki",
    "Kamakshi", "Madhuri", "Radhika", "Shweta", "Tanvi", "Vidya", "Wamika",
    "Yamini", "Abhimanyu", "Chirag", "Deven", "Farhan", "Jatin", "Kartik",
    "Kaveri", "Trupti", "Devika", "Pranav", "Shlok", "Girish", "Asmita",
    "Trisha", "Brinda", "Vedika", "Noopur", "Oviya", "Parvati", "Suhana",
    "Lehara", "Lavanya", "Yukti", "Varuni", "Saanvi", "Kavin", "Hansika",
    "Reshma", "Riyaan", "Zahira", "Ishaan", "Kirra", "Dhruva", "Damini",
    "Urvashi", "Falak", "Veera", "Lalita", "Nayana", "Gaurav", "Harshit",
    "Mehuli", "Zayan", "Poorvi",
}


class GnaniVoiceService:
    """Service client for Gnani.ai Vachana Voice AI (TTS and STT)."""

    def __init__(self):
        self.base_url = (getattr(settings, "GNANI_BASE_URL", None) or "https://api.vachana.ai").rstrip("/")
        self.tts_model = getattr(settings, "GNANI_TTS_MODEL", None) or "timbre-v2.5"
        self.stt_model = getattr(settings, "GNANI_STT_MODEL", None) or "prisma-v3.0"
        self.default_voice = getattr(settings, "GNANI_DEFAULT_VOICE", None) or "Nalini"

    @property
    def api_key(self) -> str:
        return (getattr(settings, "GNANI_API_KEY", "") or "").strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def select_voice(self, language: str = "en", preferred_voice: Optional[str] = None) -> str:
        """Select a validated voice based on voice preference or language."""
        if preferred_voice and preferred_voice in GNANI_VOICES:
            return preferred_voice
        return LANGUAGE_VOICE_MAP.get(language[:2].lower(), self.default_voice)

    async def synthesize(
        self,
        text: str,
        output_path: str,
        voice: Optional[str] = None,
        language: str = "en",
        speed: float = 1.0,
    ) -> str:
        """
        Synthesize text into WAV audio using Gnani Timbre TTS.

        Args:
            text: Text to synthesize.
            output_path: Target path for the generated WAV file.
            voice: Optional specific Gnani voice name.
            language: Language code (e.g. 'en', 'hi', 'kn').
            speed: Playback speed factor (default 1.0).

        Returns:
            output_path on success.
        """
        if not self.is_configured():
            raise ValueError("Gnani API key is not configured (GNANI_API_KEY is empty)")

        chosen_voice = self.select_voice(language, voice)
        payload = {
            "text": text,
            "voice": chosen_voice,
            "model": self.tts_model,
            "speed": speed,
            "audio_config": {
                "sample_rate": 24000,
                "num_channels": 1,
                "encoding": "linear_pcm",
                "container": "wav",
            },
        }

        url = f"{self.base_url}/api/v1/tts/inference"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key-ID": self.api_key,
        }

        logger.info(
            f"Gnani TTS: synthesizing with voice '{chosen_voice}', lang='{language}': {text[:60]}..."
        )

        def _do_tts_request() -> bytes:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    if resp.status != 200:
                        raise RuntimeError(f"Gnani TTS returned HTTP {resp.status}")
                    return resp.read()
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                logger.error(f"Gnani TTS HTTPError {e.code}: {err_body}")
                raise RuntimeError(f"Gnani TTS error {e.code}: {err_body}") from e

        audio_bytes = await asyncio.to_thread(_do_tts_request)

        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(out_file.write_bytes, audio_bytes)

        logger.info(f"Gnani TTS success: written {len(audio_bytes)} bytes to {output_path}")
        return output_path

    async def transcribe(
        self,
        audio_data: Union[bytes, str],
        language: str = "indic-auto",
    ) -> Dict[str, Any]:
        """
        Transcribe speech using Gnani Prisma v3.0 STT.

        Args:
            audio_data: Raw audio bytes or path to audio file (.wav, .webm, .mp3, etc.).
            language: 'indic-auto' for automatic Indian language detection,
                      or specific code like 'en-IN', 'hi-IN', 'kn-IN'.

        Returns:
            Dict containing 'transcript', 'detected_language_code', 'latency', etc.
        """
        if not self.is_configured():
            raise ValueError("Gnani API key is not configured (GNANI_API_KEY is empty)")

        # Prepare audio bytes and filename
        if isinstance(audio_data, (str, Path)):
            p = Path(audio_data)
            if not p.exists():
                raise FileNotFoundError(f"Audio file not found: {audio_data}")
            file_bytes = await asyncio.to_thread(p.read_bytes)
            filename = p.name
        else:
            file_bytes = audio_data
            filename = "audio.wav"

        # Map language to Prisma format
        lang_code = language
        if language in ("en", "english"):
            lang_code = "indic-auto"
        elif language in ("hi", "hindi"):
            lang_code = "hi-IN"
        elif language in ("kn", "kannada"):
            lang_code = "kn-IN"
        elif language in ("ta", "tamil"):
            lang_code = "ta-IN"
        elif language in ("te", "telugu"):
            lang_code = "te-IN"

        url = f"{self.base_url}/stt/v3"

        def _do_stt_request() -> Dict[str, Any]:
            boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
            content_type = f"multipart/form-data; boundary={boundary}"

            body = io.BytesIO()
            # 1. model field
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(b'Content-Disposition: form-data; name="model"\r\n\r\n')
            body.write(f"{self.stt_model}\r\n".encode("utf-8"))

            # 2. language_code field
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(b'Content-Disposition: form-data; name="language_code"\r\n\r\n')
            body.write(f"{lang_code}\r\n".encode("utf-8"))

            # 3. audio_file field
            mime = mimetypes.guess_type(filename)[0] or "audio/wav"
            body.write(f"--{boundary}\r\n".encode("utf-8"))
            body.write(
                f'Content-Disposition: form-data; name="audio_file"; filename="{filename}"\r\n'.encode("utf-8")
            )
            body.write(f"Content-Type: {mime}\r\n\r\n".encode("utf-8"))
            body.write(file_bytes)
            body.write(b"\r\n")

            # Final boundary
            body.write(f"--{boundary}--\r\n".encode("utf-8"))

            req_bytes = body.getvalue()
            headers = {
                "Content-Type": content_type,
                "Content-Length": str(len(req_bytes)),
                "X-API-Key-ID": self.api_key,
            }

            req = urllib.request.Request(url, data=req_bytes, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_text = resp.read().decode("utf-8")
                    return json.loads(resp_text)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                logger.error(f"Gnani STT HTTPError {e.code}: {err_body}")
                raise RuntimeError(f"Gnani STT error {e.code}: {err_body}") from e

        result = await asyncio.to_thread(_do_stt_request)
        logger.info(
            f"Gnani STT success: '{result.get('transcript', '')}' "
            f"(lang={result.get('detected_language_code')}, time={result.get('processing_time')}s)"
        )
        return result


gnani_service = GnaniVoiceService()
__all__ = ["GnaniVoiceService", "gnani_service", "GNANI_VOICES", "LANGUAGE_VOICE_MAP"]
