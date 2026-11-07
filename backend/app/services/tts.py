"""
Text-to-Speech service backed by Chatterbox Multilingual (Resemble AI).

Replaces the deprecated Coqui XTTS v2. Voice profile WAVs in `voice_profiles/`
remain compatible — Chatterbox accepts any WAV reference for zero-shot cloning.

Hindi/Kannada try the self-hosted Indic-Speak worker first, then fall back to
language-correct Edge neural voices and gTTS. For other languages the chain is:

    configured provider / chatterbox → edge-tts → gTTS

Edge TTS uses Microsoft's neural voices — dramatically better prosody than
gTTS — and needs no API key or GPU, so the degraded experience stays good.
gTTS remains as the last-ditch network fallback.

Synthesis result reports which engine produced the audio so the caller can
notify the user when voice cloning was silently dropped during fallback.
"""

import asyncio
import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
import soundfile
import torch
import torchaudio

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SynthResult:
    output_path: str
    engine: str  # e.g. "indic-speak", "chatterbox", "gnani", "edge-tts", or "gtts"
    fallback: bool  # True if the caller's preferred path was not taken
    voice_cloned: bool  # True if a speaker WAV was actually applied


# Microsoft neural voices for the Edge TTS fallback, one per supported
# language (the same 23-language set the voices API allows). Anything not
# listed falls back to the English voice.
_EDGE_VOICES = {
    "ar": "ar-SA-ZariyahNeural",
    "da": "da-DK-ChristelNeural",
    "de": "de-DE-KatjaNeural",
    "el": "el-GR-AthinaNeural",
    "en": "en-US-AriaNeural",
    "kn": "kn-IN-SapnaNeural",
    "es": "es-ES-ElviraNeural",
    "fi": "fi-FI-NooraNeural",
    "fr": "fr-FR-DeniseNeural",
    "he": "he-IL-HilaNeural",
    "hi": "hi-IN-SwaraNeural",
    "it": "it-IT-ElsaNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "ms": "ms-MY-YasminNeural",
    "nl": "nl-NL-ColetteNeural",
    "no": "nb-NO-PernilleNeural",
    "pl": "pl-PL-ZofiaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "sv": "sv-SE-SofieNeural",
    "sw": "sw-KE-ZuriNeural",
    "tr": "tr-TR-EmelNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
}

_EDGE_VOICES_BY_GENDER = {
    "en": {"female": "en-IN-NeerjaNeural", "male": "en-IN-PrabhatNeural"},
    "kn": {"female": "kn-IN-SapnaNeural", "male": "kn-IN-GaganNeural"},
    "hi": {"female": "hi-IN-SwaraNeural", "male": "hi-IN-MadhurNeural"},
}

# Older configs may still say "coqui"/"xtts" (the engine Chatterbox replaced).
# Treat them as chatterbox instead of breaking every synthesis call.
_LEGACY_PROVIDER_ALIASES = {"coqui": "chatterbox", "xtts": "chatterbox", "xtts_v2": "chatterbox"}


class TTSService:
    """Text-to-Speech service. Lazy-loads the model on first synthesis."""

    def __init__(self):
        provider = settings.TTS_PROVIDER
        if provider in _LEGACY_PROVIDER_ALIASES:
            logger.warning(
                f"TTS_PROVIDER={provider!r} is deprecated (Coqui XTTS was replaced "
                f"by Chatterbox) — using 'chatterbox'. Update your .env."
            )
            provider = _LEGACY_PROVIDER_ALIASES[provider]
        self.provider = provider
        self.model = None
        self._init_lock = asyncio.Lock()

    def _check_cuda(self) -> bool:
        try:
            return torch.cuda.is_available()
        except Exception:
            return False

    async def initialize(self):
        """Load the Chatterbox model (downloaded from HuggingFace on first run).

        Guarded by a lock — without it, concurrent WebSocket sessions each
        call initialize() before the first one finishes, and they all race
        to download/load the same multi-GB model at once, fighting over the
        same HuggingFace cache lock files (worse on Windows, where the cache
        already runs in degraded no-symlink mode).
        """
        if self.model is not None:
            return

        async with self._init_lock:
            if self.model is not None:  # re-check: another coroutine may have just finished
                return

            if self.provider in ("gnani", "edge-tts", "gtts"):
                return

            if self.provider != "chatterbox":
                raise ValueError(f"Unsupported TTS provider: {self.provider}")

            try:
                from chatterbox.mtl_tts import ChatterboxMultilingualTTS

                device = "cuda" if self._check_cuda() else "cpu"
                logger.info(f"Loading Chatterbox multilingual TTS on {device}...")
                self.model = await asyncio.to_thread(
                    ChatterboxMultilingualTTS.from_pretrained, device=device
                )
                logger.info(f"Chatterbox loaded (sr={self.model.sr}, device={device})")

            except Exception as e:
                logger.error(f"Failed to load Chatterbox: {e}")
                raise

    async def synthesize(
        self,
        text: str,
        output_path: str,
        speaker_wav: Optional[str] = None,
        language: str = "en",
        voice_gender: Optional[str] = None,
    ) -> SynthResult:
        """
        Synthesize speech.

        Args:
            text: Text to speak.
            output_path: Destination WAV path.
            speaker_wav: Optional reference audio for voice cloning (≥10s recommended).
            language: 2-letter code from Chatterbox's 23-language set.

        Returns:
            SynthResult describing the WAV path and which engine was used.
            `fallback=True` indicates the preferred path failed.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # Hindi and Kannada: prefer the self-hosted Indic-Speak worker when it is running, but
        # never leave the patient in silence when it is not (it needs a GPU machine). The
        # fallbacks below are free and always speak the *correct* language: Microsoft neural
        # Hindi/Kannada voices (male/female per doctor), then Google TTS. An English voice is
        # never substituted.
        language_code = (language or "en").split("-")[0].lower()
        if language_code in {"hi", "kn"}:
            try:
                return await self._indic_speak(
                    text=text,
                    output_path=output_path,
                    language=language_code,
                    voice_gender=voice_gender,
                )
            except ValueError:
                raise  # corrupted/invalid text must never be spoken by a fallback
            except Exception as indic_err:
                logger.warning(
                    "Indic-Speak unavailable for %s (%s); using free neural-voice fallback",
                    language_code,
                    indic_err,
                )
            try:
                await self._edge_fallback(text, output_path, language_code, voice_gender)
                return SynthResult(output_path, "edge-tts", True, False)
            except Exception as edge_err:
                logger.warning("Edge TTS failed for %s (%s); trying gTTS", language_code, edge_err)
            await self._gtts_fallback(text, output_path, language_code)
            return SynthResult(output_path, "gtts", True, False)

        # Preserve the existing English/other-language male voice path.
        if voice_gender == "male":
            await self._edge_fallback(text, output_path, language, voice_gender)
            return SynthResult(
                output_path=output_path,
                engine="edge-tts",
                fallback=False,
                voice_cloned=False,
            )

        if self.provider == "gnani":
            from app.services.gnani_service import gnani_service

            try:
                await gnani_service.synthesize(text, output_path, language=language)
                return SynthResult(
                    output_path=output_path,
                    engine="gnani",
                    fallback=False,
                    voice_cloned=False,
                )
            except Exception as e:
                logger.warning(f"Gnani TTS failed ({e}), falling back to Edge TTS")
                try:
                    await self._edge_fallback(text, output_path, language, voice_gender)
                    return SynthResult(
                        output_path=output_path,
                        engine="edge-tts",
                        fallback=True,
                        voice_cloned=False,
                    )
                except Exception as edge_err:
                    logger.warning(f"Edge TTS fallback also failed ({edge_err}), using gTTS")
                    await self._gtts_fallback(text, output_path, language)
                    return SynthResult(
                        output_path=output_path,
                        engine="gtts",
                        fallback=True,
                        voice_cloned=False,
                    )

        try:
            if self.model is None:
                await self.initialize()

            logger.info(f"Synthesizing (chatterbox, lang={language}): {text[:80]}...")

            if speaker_wav and not Path(speaker_wav).exists():
                logger.warning(f"Speaker WAV not found: {speaker_wav!r} — using default voice")
                speaker_wav = None

            kwargs = {"language_id": language}
            if speaker_wav:
                kwargs["audio_prompt_path"] = speaker_wav

            wav = await asyncio.to_thread(self.model.generate, text, **kwargs)
            await asyncio.to_thread(torchaudio.save, output_path, wav, self.model.sr)

            logger.info(
                f"Synthesis complete{' (cloned voice)' if speaker_wav else ''}: {output_path}"
            )
            return SynthResult(
                output_path=output_path,
                engine="chatterbox",
                fallback=False,
                voice_cloned=bool(speaker_wav),
            )

        except Exception as e:
            if speaker_wav:
                logger.warning(
                    f"Chatterbox voice-clone failed — cloned voice NOT applied, "
                    f"falling back to a default neural voice. Error: {e}"
                )
            else:
                logger.warning(f"Chatterbox failed ({e}), trying Gnani/Edge TTS fallback")

            # Try Gnani.ai first if configured (native Indian neural voice)
            from app.services.gnani_service import gnani_service

            if gnani_service.is_configured():
                try:
                    await gnani_service.synthesize(text, output_path, language=language)
                    return SynthResult(
                        output_path=output_path,
                        engine="gnani",
                        fallback=True,
                        voice_cloned=False,
                    )
                except Exception as gnani_err:
                    logger.warning(f"Gnani TTS fallback failed ({gnani_err}), trying Edge TTS")

            # Prefer Edge TTS (Microsoft neural voices — much better prosody
            # than gTTS, still free and CPU-only); gTTS is the last resort.
            try:
                await self._edge_fallback(text, output_path, language, voice_gender)
                engine = "edge-tts"
            except Exception as edge_err:
                logger.warning(f"Edge TTS failed ({edge_err}), falling back to gTTS")
                await self._gtts_fallback(text, output_path, language)
                engine = "gtts"

            return SynthResult(
                output_path=output_path,
                engine=engine,
                fallback=True,
                voice_cloned=False,
            )

    async def _indic_speak(
        self,
        text: str,
        output_path: str,
        language: str,
        voice_gender: Optional[str],
    ) -> SynthResult:
        """Call the self-hosted Indic-Speak worker for Hindi or Kannada only."""
        if "\ufffd" in text:
            raise ValueError(f"Refusing corrupted Unicode text for Indic-Speak ({language}).")

        base_url = settings.INDIC_SPEAK_URL.rstrip("/")
        timeout = httpx.Timeout(settings.INDIC_SPEAK_TIMEOUT_SECONDS, connect=5.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    f"{base_url}/synthesize",
                    json={
                        "text": text,
                        "language": language,
                        "voice_gender": voice_gender or "female",
                    },
                )
        except httpx.HTTPError as exc:
            logger.error("Local Indic-Speak worker request failed [%s]: %s", language, exc)
            raise RuntimeError(
                "The local Indic-Speak service is unavailable. Start the Indic-Speak worker "
                "on the configured INDIC_SPEAK_URL; no external or English voice fallback was used."
            ) from exc

        if response.status_code != 200:
            logger.error(
                "Local Indic-Speak worker returned HTTP %s [%s]",
                response.status_code,
                language,
            )
            raise RuntimeError(
                f"Local Indic-Speak synthesis failed for {language} (HTTP {response.status_code}); "
                "no external or English voice fallback was used."
            )

        audio_bytes = response.content
        try:
            info = soundfile.info(io.BytesIO(audio_bytes))
        except Exception as exc:
            raise ValueError("Indic-Speak returned an invalid WAV file.") from exc

        if (
            info.format != "WAV"
            or info.samplerate != 24000
            or info.channels != 1
            or info.frames <= 0
        ):
            raise ValueError(
                "Indic-Speak must return non-empty mono WAV audio at 24 kHz; "
                f"received format={info.format}, rate={info.samplerate}, "
                f"channels={info.channels}, frames={info.frames}."
            )

        await asyncio.to_thread(Path(output_path).write_bytes, audio_bytes)
        return SynthResult(
            output_path=output_path,
            engine="indic-speak",
            fallback=False,
            voice_cloned=False,
        )

    async def _edge_fallback(
        self,
        text: str,
        output_path: str,
        language: str = "en",
        voice_gender: Optional[str] = None,
    ) -> str:
        """Free neural-voice fallback via Microsoft Edge TTS (no key, no GPU)."""
        import edge_tts
        from pydub import AudioSegment

        voice = _EDGE_VOICES_BY_GENDER.get(language, {}).get(voice_gender or "")
        voice = voice or _EDGE_VOICES.get(language, _EDGE_VOICES["en"])
        logger.info(f"Synthesizing (edge-tts, {voice}): {text[:80]}...")
        mp3_path = str(Path(output_path).with_suffix(".edge.mp3"))

        try:
            await edge_tts.Communicate(text, voice).save(mp3_path)
            await asyncio.to_thread(
                lambda: AudioSegment.from_mp3(mp3_path).export(output_path, format="wav")
            )
            logger.info(f"Edge TTS synthesis complete: {output_path}")
            return output_path
        finally:
            Path(mp3_path).unlink(missing_ok=True)

    @staticmethod
    def _gtts_language(language: str) -> str:
        """
        Map a session language onto one gTTS actually supports.

        gTTS covers 59 languages but not the same 23 this app offers — Hebrew
        ("he") is accepted everywhere else in the stack and rejected here with
        ValueError. Since gTTS is the last link in the chain, letting that
        raise turned a supported language into silence, which is exactly what
        the fallback chain exists to prevent. Speaking the text in an English
        voice is a poor result; producing nothing is a broken one.
        """
        try:
            from gtts.lang import tts_langs

            if language in tts_langs():
                return language
        except Exception:
            # Language list unavailable (offline, API change) — try as given
            # and let the synth attempt decide.
            return language
        logger.warning(f"gTTS does not support {language!r}; speaking with the English voice")
        return "en"

    async def _gtts_fallback(self, text: str, output_path: str, language: str = "en") -> str:
        """Network-only fallback using Google TTS — no GPU/local model required."""
        # Build the temp name from the path's stem rather than replacing the
        # first ".wav" found anywhere in the string, which would corrupt a path
        # like /tmp/a.wav.d/out.wav.
        mp3_path = str(Path(output_path).with_suffix(".gtts.mp3"))
        try:
            from gtts import gTTS
            from pydub import AudioSegment

            lang = self._gtts_language(language)
            logger.info(f"Synthesizing (gTTS, lang={lang}): {text[:80]}...")

            await asyncio.to_thread(lambda: gTTS(text=text, lang=lang, slow=False).save(mp3_path))
            await asyncio.to_thread(
                lambda: AudioSegment.from_mp3(mp3_path).export(output_path, format="wav")
            )

            logger.info(f"gTTS synthesis complete: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"gTTS also failed: {e}")
            raise
        finally:
            # In a finally so a failed mp3->wav conversion doesn't strand the
            # intermediate file in the session directory.
            Path(mp3_path).unlink(missing_ok=True)

    async def synthesize_bytes(
        self,
        text: str,
        speaker_wav: Optional[str] = None,
        language: str = "en",
    ) -> bytes:
        """Synthesize and return WAV bytes (used by REST callers)."""
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            await self.synthesize(text, tmp_path, speaker_wav, language)
            return Path(tmp_path).read_bytes()
        finally:
            Path(tmp_path).unlink(missing_ok=True)


# Suppress unused-name warning — re-exported for type hints elsewhere
__all__ = ["TTSService", "SynthResult", "tts_service"]


# Global instance
tts_service = TTSService()
