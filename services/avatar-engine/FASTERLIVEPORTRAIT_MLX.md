# FasterLivePortrait-MLX integration (experimental)

This is the opt-in local Apple-Silicon path for audio-driven speaking portraits. It integrates the upstream [FasterLivePortrait-MLX](https://github.com/ivanfioravanti/fasterliveportrait-mlx) pipeline with the existing consultation backend; it does not replace the default MuseTalk engine.

## Install and enable

On an Apple-Silicon Mac, from the project root:

```bash
brew install uv ffmpeg
bash scripts/setup_fasterliveportrait_mlx.sh
```

The setup clones the upstream code at the prototype-tested commit `d5361f4`, creates an isolated `.venv`, and downloads converted runtime weights at revision `2cc2ac9`. The backend's PyTorch environment is not modified. Model files are not checked into Git.

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

FasterLivePortrait-MLX successfully produced a video through the backend's actual persistent-worker adapter on the M5 Mac. A 3.2-second test utterance took 32.7 seconds to render after the worker was ready; cold worker initialization took another 31.8 seconds. The resulting H.264/AAC file is 3.2 seconds long at 25 fps (80 frames), but the render ran at roughly one tenth of audio real time. This is an offline result, not live frame delivery.

The browser intentionally ignores a video chunk if its matching audio has already finished. With the measured MLX throughput, typical short replies therefore won't get a timely speaking video. Do not describe this local path as millisecond, frame-synchronous, or real-time. To meet that requirement, the project needs a substantially faster inference target or a different streaming-avatar architecture; buffering audio until MLX finishes would create a long first-audio delay instead.

Before enabling it for patients, benchmark a 30-second response for each portrait on the intended hardware, and verify time-to-first-audio, time-to-first-video, render/audio duration ratio, A/V offset and drift, interruption, and memory stability. Keep a copy of the model revision and review each upstream code, dependency, and model-asset license before distribution.
