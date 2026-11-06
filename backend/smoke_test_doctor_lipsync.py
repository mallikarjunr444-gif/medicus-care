"""Deployment smoke test for both bundled doctor voices and lip-sync videos.

Run inside the GPU backend container after model warmup:
    python smoke_test_doctor_lipsync.py

Only generic test phrases are sent to the configured TTS provider; never use
patient text or recordings in this check.
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import tempfile
import time
from fractions import Fraction
from pathlib import Path

from app.services.animator import avatar_animator
from app.services.tts import tts_service


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DOCTOR_CASES = (
    (
        "dr_ananya",
        "Dr. Ananya",
        "female",
        "Hello, this is a short lip sync test for Dr. Ananya.",
    ),
    (
        "dr_arjun",
        "Dr. Smit",
        "male",
        "Hello, this is a short lip sync test for Dr. Smit.",
    ),
)


def _probe(path: Path) -> dict:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_type,codec_name,duration,r_frame_rate,nb_frames",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def _stream_duration(stream: dict, media: dict) -> float:
    return float(stream.get("duration") or media["format"]["duration"])


async def _run() -> int:
    failures = 0
    try:
        await avatar_animator.warmup()
        with tempfile.TemporaryDirectory(prefix="doctor-lipsync-smoke-") as work:
            work_dir = Path(work)
            for doctor_id, doctor_name, voice_gender, phrase in DOCTOR_CASES:
                image_path = PROJECT_ROOT / "frontend" / "public" / "doctor" / f"{doctor_id}.jpg"
                audio_path = work_dir / f"{doctor_id}.wav"
                video_path = work_dir / f"{doctor_id}.mp4"
                try:
                    if not image_path.is_file():
                        raise FileNotFoundError(f"Bundled doctor portrait is missing: {image_path}")

                    tts_started = time.perf_counter()
                    synth = await tts_service.synthesize(
                        text=phrase,
                        output_path=str(audio_path),
                        language="en",
                        voice_gender=voice_gender,
                    )
                    tts_seconds = time.perf_counter() - tts_started
                    audio_info = _probe(audio_path)
                    audio_stream = next(
                        stream for stream in audio_info["streams"] if stream["codec_type"] == "audio"
                    )
                    audio_duration = _stream_duration(audio_stream, audio_info)

                    render_started = time.perf_counter()
                    await avatar_animator.animate(
                        avatar_image_path=str(image_path),
                        audio_path=str(audio_path),
                        output_path=str(video_path),
                        require_lipsync=True,
                    )
                    render_seconds = time.perf_counter() - render_started

                    video_info = _probe(video_path)
                    video_stream = next(
                        stream for stream in video_info["streams"] if stream["codec_type"] == "video"
                    )
                    muxed_audio = next(
                        stream for stream in video_info["streams"] if stream["codec_type"] == "audio"
                    )
                    fps = float(Fraction(video_stream["r_frame_rate"]))
                    video_duration = _stream_duration(video_stream, video_info)
                    muxed_audio_duration = _stream_duration(muxed_audio, video_info)
                    realtime_ratio = render_seconds / audio_duration

                    if fps < 24:
                        raise RuntimeError(f"Output is only {fps:.2f} fps; expected at least 24 fps")
                    if abs(video_duration - muxed_audio_duration) > 0.15:
                        raise RuntimeError(
                            "Video and embedded audio durations differ by more than 150 ms"
                        )
                    if realtime_ratio > 1.0:
                        raise RuntimeError(
                            f"GPU is not keeping up: {audio_duration:.2f}s speech took "
                            f"{render_seconds:.2f}s to animate ({realtime_ratio:.2f}x real time)"
                        )

                    print(
                        f"PASS {doctor_id} ({doctor_name}, {voice_gender} voice): "
                        f"TTS={synth.engine}, TTS={tts_seconds:.2f}s, "
                        f"render={render_seconds:.2f}s/{audio_duration:.2f}s audio, "
                        f"{fps:.0f} fps, {int(video_stream.get('nb_frames', 0))} frames"
                    )
                except Exception as exc:
                    failures += 1
                    print(f"FAIL {doctor_id} ({doctor_name}): {type(exc).__name__}: {exc}")
    except Exception as exc:
        failures += 1
        print(f"FAIL avatar engine warmup: {type(exc).__name__}: {exc}")
    finally:
        await avatar_animator.cleanup()

    print("RESULT: both doctor lip-sync paths passed" if not failures else f"RESULT: {failures} check(s) failed")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_run()))
