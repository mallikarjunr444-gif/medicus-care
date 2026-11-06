"""Generate and validate the agreed Hindi/Kannada Indic-Speak test phrases.

Run from `backend/` after starting the local Indic-Speak worker. The script
validates the WAV container only; a human must still listen for intelligibility.
"""

from __future__ import annotations

import io
import json
import os
import tempfile
import urllib.request
import wave
from pathlib import Path

CASES = (
    (
        "hindi",
        "hi",
        "नमस्ते, मैं आपका डॉक्टर हूँ। आज आपको क्या परेशानी हो रही है?",
    ),
    (
        "kannada",
        "kn",
        "ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು. ಇಂದು ನಿಮಗೆ ಏನು ತೊಂದರೆ ಆಗುತ್ತಿದೆ?",
    ),
)


def main() -> None:
    base_url = os.environ.get("INDIC_SPEAK_URL", "http://127.0.0.1:8001").rstrip("/")
    output_dir = Path(tempfile.gettempdir()) / "medicus-care-indic-speak"
    output_dir.mkdir(parents=True, exist_ok=True)

    for name, language, text in CASES:
        body = json.dumps(
            {"text": text, "language": language, "voice_gender": "male"},
            ensure_ascii=False,
        ).encode("utf-8")
        request = urllib.request.Request(
            f"{base_url}/synthesize",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=300) as response:
            wav_bytes = response.read()
            model = response.headers.get("X-TTS-Model", "unknown")
            speaker = response.headers.get("X-TTS-Speaker", "unknown")

        path = output_dir / f"{name}.wav"
        path.write_bytes(wav_bytes)
        with wave.open(io.BytesIO(wav_bytes), "rb") as wav:
            frame_count = wav.getnframes()
            frame_bytes = wav.readframes(frame_count)
            details = {
                "channels": wav.getnchannels(),
                "sample_width_bytes": wav.getsampwidth(),
                "sample_rate": wav.getframerate(),
                "duration_seconds": frame_count / wav.getframerate(),
            }

        if (
            details["channels"] != 1
            or details["sample_width_bytes"] != 2
            or details["sample_rate"] != 24000
            or frame_count <= 0
            or not any(frame_bytes)
        ):
            raise RuntimeError(f"Invalid or silent WAV generated for {name}: {details}")

        print(f"{name}: model={model}, speaker={speaker}, {details}, file={path}")

    print("WAV checks passed. Listen to both files; this script cannot judge pronunciation.")


if __name__ == "__main__":
    main()
