# FasterLivePortrait-MLX integration (experimental)

This is the opt-in local Apple-Silicon path for audio-driven speaking portraits. It integrates the upstream [FasterLivePortrait-MLX](https://github.com/ivanfioravanti/fasterliveportrait-mlx) pipeline with the existing consultation backend; it does not replace the default MuseTalk engine.

## Install and enable

On an Apple-Silicon Mac, from the project root:

```bash
brew install uv ffmpeg
bash scripts/setup_fasterliveportrait_mlx.sh
```

The setup clones the upstream code into the ignored `backend/models/FasterLivePortrait-MLX` directory, creates an isolated `.venv`, and downloads converted runtime weights from Hugging Face. The backend's PyTorch environment is not modified. Model files are not checked into Git.

Opt in through `.env`:

```dotenv
AVATAR_ENGINE=mlx
MLX_AVATAR_PATH=models/FasterLivePortrait-MLX
MLX_AVATAR_PROFILE=ultra
```

Run natively with `./start.sh --dev`. Docker Desktop does not pass Apple's Metal device into its Linux containers; Docker mode is not supported for this engine. The backend continues to send TTS audio as soon as it is synthesized and renders video on its background worker. A slow render must not delay speech.

## Runtime behavior

- `backend/app/services/animator.py` starts one isolated persistent worker using the MLX checkout's Python environment.
- `backend/fasterliveportrait_mlx_worker.py` sends the exact avatar photo and matching TTS WAV through JoyVASA audio-to-motion and LivePortrait rendering, then returns an H.264 video containing that same audio.
- The default `ultra` profile is the upstream experimental throughput profile; use `quality` if visual artifacts are unacceptable. Neither profile is a real-time guarantee.
- If setup is missing or optional inference fails, ordinary animation requests use the existing static-image/audio fallback. Doctor turns marked as requiring lip-sync report a video error instead of presenting an unsynchronized static clip as lip-synced output.
- The backend's existing `audio_chunk` path remains independent, so patients can hear the response while the video is still rendering.

## Readiness and limits

FasterLivePortrait-MLX successfully produced sample videos for both doctor portraits on the M5 Mac during the prototype evaluation. Those samples were generated offline. The measured notes from that experiment cover source preparation and JoyVASA motion time, but do not yet establish full per-chunk render time, sustained throughput, memory headroom, or A/V drift in the integrated backend. Treat this as an opt-in experiment, not a production-real-time claim.

Before enabling it for patients, measure warm and cold start separately, run a 30-second response for each portrait, and verify time-to-first-audio, time-to-first-video, render/audio duration ratio, A/V offset and drift, interruption, and memory stability. Keep a copy of the model revision and review each upstream code, dependency, and model-asset license before distribution.
