# Doctor portrait animation: CPU-only evaluation

## Apple-Silicon follow-up (2026-11-05)

The earlier CPU-only decision is not the full picture for the target Mac: an M5 has an integrated Apple GPU that MLX can use through Metal, even though it has no NVIDIA/CUDA GPU. FasterLivePortrait-MLX with JoyVASA has since generated offline speaking clips for both doctor portraits, and an opt-in backend worker is now available. This does **not** establish real-time suitability: full warm per-chunk throughput, first-video latency, A/V drift, and sustained memory use still need to be measured on the integrated path. See [FASTERLIVEPORTRAIT_MLX.md](FASTERLIVEPORTRAIT_MLX.md).

## Decision

There is not yet evidence for a production-ready real-time path on the M5 without a paid API. Do not infer live performance from offline clips or GPU FPS claims. The separate `services/avatar-engine` readiness API still has metadata-only adapters (`/health` reports `inference_available: false`, `/animate` returns 503); the tested integration is the consultation backend's `AVATAR_ENGINE=mlx` worker, not that API. The live call must not describe an offline or still-photo path as real-time neural animation.

For a future GPU-enabled deployment, **MuseTalk** is the closest fit for speech-driven mouth sync and streaming, with **LiveTalking** as the serving/streaming wrapper rather than an animation model. MuseTalk's documented throughput is on NVIDIA hardware (30+ fps on V100); the project does not publish CPU timings. This is not a valid CPU benchmark and should not be represented as one. LivePortrait is useful for motion transfer/idle motion, not by itself a reliable audio-viseme solution. SadTalker is the most plausible occasional CPU experiment, but its own project materials characterize CPU rendering as slow; it is not suitable for immediate first-chunk playback.

## Repository comparison

| Project | Repository license | What it does / evidence | CPU-only conclusion |
|---|---|---|---|
| [LivePortrait](https://github.com/KlingAIResearch/LivePortrait) | MIT; bundled InsightFace detector weights have separate terms, including a non-commercial restriction | Motion transfer/template-driven portrait animation. README documents Apple Silicon MPS but notes it can be about 20x slower than RTX 4090. | No ordinary-CPU real-time claim. Audio is not its core direct lip-sync input. |
| [MuseTalk](https://github.com/TMElyralab/MuseTalk) | MIT code; model/dependency/data terms must be checked individually | Audio-driven lip sync. README reports 30+ fps on V100 and roughly 5 minutes for 8 seconds on RTX 3050 Ti Laptop FP16; documents identity detail/jitter limitations. | CUDA-first. No CPU timings; not a valid CPU fallback. |
| [EchoMimic](https://github.com/antgroup/echomimic) | Apache-2.0 code; separately sourced model/component licenses still apply | Audio-driven diffusion portrait animation; accelerated README timing is around 50 seconds for 240 frames on V100. | GPU-oriented, no documented CPU performance. |
| [AniPortrait](https://github.com/Zejun-Yang/AniPortrait) | Apache-2.0 code; pretrained components have their own terms | Audio2mesh/audio2pose plus diffusion animation. | CUDA-oriented; no CPU timing claim. |
| [SadTalker](https://github.com/OpenTalker/SadTalker) | Apache-2.0 code; verify checkpoints/dependencies separately | Single-image audio-driven animation. README/maintainer materials allow CPU execution but characterize face rendering on CPU as too slow. | Most plausible CPU test candidate, but not real-time or first-chunk streaming based on published evidence. |
| [LiveTalking](https://github.com/lipku/LiveTalking) | Apache-2.0; README has edition/platform watermark conditions and renderer licenses must be checked | Streaming orchestration around renderers including Wav2Lip/MuseTalk. Published real-time figures use GPUs (e.g. RTX 3060/3080 Ti). | CPU is not the speaking inference target. Wrapper does not make GPU models CPU-fast. |

These are repository claims and a qualitative assessment, not measurements on this host. They do not establish identity retention, blink quality, expressions, 30-second sync, or first-chunk latency for either doctor. Model weights are not installed as an executable inference stack here, and this environment has no dedicated GPU. Consequently, no acceptance test has been passed and no CPU benchmark is claimed.

## Current pipeline gap

The intended pipeline is TTS chunk → playable audio immediately → concurrent, audio-timestamped frame generation. The checked-in avatar adapters are metadata/readiness stubs rather than model runners. Offline video rendering cannot satisfy “audio starts with first usable chunk” unless the actual audio and frames are streamed concurrently. The frontend's lightweight mouth/eye overlays are not genuine facial deformation and should not be presented as photorealistic animation.

## Acceptance test required before enabling an animated claim

On the target CPU-only machine, run a 30-second response for **each exact source portrait** and capture audio plus rendered frames with timestamps. Measure time-to-first-audio, dropped-frame rate, A/V offset and drift, and inspect identity, mouth closure/vowels, blinks, expressions, interruption and return-to-listening. Require visible audio-correlated mouth motion throughout speech, no motion after audio ends, preserved recognizable identity, and no misleading overlay-only fallback. Record hardware, model/checkpoint hashes, runtime versions, and all dependency/checkpoint licenses. If these gates fail, show the unchanged portrait with audio and label it honestly as audio-only.
