# Avatar model audit and first-cycle readiness

**Audit date:** 2026-11-03
**Outcome:** Source checkouts are present; usable model installations and an end-to-end Dr. Ananya implementation are not.

## Model comparison

| Model | What its upstream implementation does | Repository/checkpoint state here | Licence and runtime notes | Fit for first cycle |
|---|---|---|---|---|
| **MuseTalk** | Audio-conditioned mouth inpainting on a portrait/video. Upstream provides a real-time dubbing inference path. | Source exists; `models/` and all required weights are absent. The backend's separate `musetalk_worker.py` can run real inference only after its model assets and dependencies are installed. The avatar-engine adapter here is a placeholder. | Upstream code and model are stated as MIT / available for commercial use; the README calls out separate licences for dependencies and test data. The provided setup is GPU-oriented. | **Best first speaking candidate** because it focuses on audio lip-sync and the backend already contains a worker integration. It still requires checkpoint setup and browser/session wiring. |
| **EchoMimic V3** | Audio-driven portrait/human video generation using a 1.3B-parameter diffusion model; supports audio conditioning but is designed for generated clips, not low-latency turn streaming. | Source exists; expected Wan base model, transformer, audio encoder and other model assets are absent. Its adapter does not load or call upstream inference. | Repository and models state Apache-2.0. Upstream Flash notes 12 GB VRAM; the regular setup is CUDA-centric. | Useful quality comparison after a GPU runner exists. Poor fit for first-frame latency in a live consultation on this Mac. |
| **EchoMimic (V1)** | Audio-driven portrait video diffusion with editable landmark conditioning. Upstream documents about 50 seconds for 240 frames on a V100 with its accelerated model (older non-accelerated path is much slower). | Source exists; its denoising/reference/motion/face-locator checkpoints and audio processor are absent. | Upstream setup targets CUDA 11.7+ and lists V100 16 GB, RTX 4090D 24 GB, or A100 80 GB. Repository describes intended academic research use; review exact model/data terms before product deployment. | A batch-generation alternative, not a streaming first choice. |
| **LivePortrait** | Portrait motion transfer from a driving video; it is not an audio-to-mouth model and does not by itself create a live listening stream. | Source exists; `pretrained_weights/` contains only `.gitkeep`. The local adapter checks outdated checkpoint names and returns metadata, not frames. | Code is MIT, but upstream notes InsightFace detection models are non-commercial research only. Upstream documents Apple Silicon support, with a warning that it can be much slower than an RTX 4090. | Could create idle motion from a driving sequence after weights and a real frame-serving path are added. It cannot replace MuseTalk for speaking. |
| **AniPortrait** | Audio-to-pose/mesh and diffusion rendering for portrait animation. Generates a clip rather than a response-time stream. | Source exists; the listed trained and base-model weights are absent (the local `pretrained_model/` directory contains only an instruction placeholder). The adapter does not run inference. | Code is Apache-2.0. Its published requirements pin CUDA-era PyTorch, `onnxruntime-gpu`, and `xformers`; its checkpoints and third-party base models have separate conditions to verify. | Not suitable for the first live turn without a GPU deployment and substantial inference work. |

## Existing MediCare path

`backend/app/websocket.py` already sends response sentences through the configured TTS provider, passes the generated WAV to `backend/app/services/animator.py`, then emits video chunks. Its MuseTalk worker is the shortest route to real audio-driven frames. However:

1. `frontend/components/doctor/DoctorVideoCall.tsx` currently generates responses with the local `analyzePatientInput` helper and uses browser speech synthesis; it does not create a backend session or send the question to the AI backend.
2. Two fixed prerecorded Dr. Ananya MP4s are present in `frontend/public/videos/`, but they are not response-specific model output and are no longer wired into `DoctorVideoCall`.
3. The component has no connection to the backend's real `video_chunk` events.
4. The main backend server is not running in the checked environment, and its database, LLM/TTS availability, and MuseTalk worker cannot be exercised here.
5. `backend/app/services/animator.py` falls back to a still-image-plus-audio MP4 on inference errors. That fallback must be disabled for this acceptance path so it cannot be mistaken for synchronized animation.

The separate `services/avatar-engine/app/models/*_adapter.py` files are not executable model integrations: their `generate_*` methods return dictionaries without loading weights, generating frames, or checking audio/video alignment. They must not be described as active models.

## Host and checkpoint inspection

- Machine: Apple Silicon macOS, 16 GB unified memory; no NVIDIA GPU/CUDA.
- Active Python environment: no PyTorch, FastAPI, OpenCV, Diffusers, Transformers, or SoundFile.
- No model checkpoint files were found in the five checked-out model directories.
- Existing source code alone is insufficient to reproduce model output. The project does not currently have the required checkpoints or an installed inference environment on this machine.

## Service behavior change

The avatar-engine `/health` response no longer advertises a simultaneous ensemble or fabricated FPS/latency. `/animate` now returns HTTP 503, and `/ws/stream` emits an error until a real inference adapter and model files are installed. This makes the current state observable without implying that placeholder outputs are model results.

## Official references consulted

- [MuseTalk repository and licence/setup notes](https://github.com/TMElyralab/MuseTalk)
- [EchoMimic V3 repository and GPU notes](https://github.com/antgroup/echomimic_v3)
- [EchoMimic repository and tested GPUs](https://github.com/antgroup/echomimic)
- [LivePortrait repository, macOS setup, and model-weight notes](https://github.com/KlingAIResearch/LivePortrait)
- [LivePortrait licence and InsightFace caveat](https://github.com/KlingAIResearch/LivePortrait/blob/main/LICENSE)
- [AniPortrait repository and checkpoint list](https://github.com/Zejun-Yang/AniPortrait)
