# MEDICARE™ CLONED AVATAR MODEL INTEGRATION STATUS
**Inspection Timestamp:** November 3, 2026, 21:26 IST  
**Location:** `services/avatar-engine/models/`  
**Host Environment:** Apple Silicon M5 (Darwin arm64, 16GB Unified RAM) / Cloud Target: NVIDIA CUDA 12.x (A10G / RTX 4090)

---

## 1. Repository Inventory & Integrity Status

| # | Model Name | Clone Status | Code Licence | Weights / Licence Restriction | Python / Framework | Role in MediCare Pipeline |
|---|---|---|---|---|---|---|
| 1 | **LivePortrait** | **Cloned & Verified** (`services/avatar-engine/models/LivePortrait`) | MIT License | Research / Non-commercial checkpoint release | PyTorch >= 2.0, ONNXRuntime, MediaPipe | **Primary Idle / Listening Animation** (Blinks, gaze, subtle nods) |
| 2 | **MuseTalk** | **Cloned & Verified** (`services/avatar-engine/models/MuseTalk`) | MIT License | CC-BY-NC 4.0 | PyTorch, Diffusers, Whisper audio features | **Primary Speaking Lip-Sync** (Real-time audio-to-mouth visemes) |
| 3 | **EchoMimic V3** | **Cloned & Verified** (`services/avatar-engine/models/echomimic_v3`) | Apache 2.0 | Apache 2.0 Permissive | PyTorch, Diffusers, Audio-Driven Diffusion | **High-Fidelity Audio-Driven Portrait** (Batch / Secondary speaking) |
| 4 | **EchoMimic** | **In-flight / Cloning** (`services/avatar-engine/models/echomimic`) | Apache 2.0 | Apache 2.0 Permissive | PyTorch, Audio Landmark Alignment | Alternate Speaking / Fallback Model |
| 5 | **AniPortrait** | **Cloning in progress** (`services/avatar-engine/models/AniPortrait`) | Apache 2.0 | Apache 2.0 Permissive | PyTorch, Audio2Video diffusion | Alternate Evaluation Candidate |

---

## 2. Detailed Technical Findings

### A. LivePortrait (`LivePortrait/`)
- **Key Capabilities:** Implicit keypoint-based video driving; 30–60 FPS inference; zero distortion on eyes, hair, and doctor stethoscope.
- **Dependencies:** `opencv-python`, `torch`, `torchvision`, `numpy`, `pyyaml`, `scipy`, `imageio`, `ffmpeg`.
- **Pretrained Weights Required:**
  - `spade_generator.pth` (~120MB)
  - `warping_module.pth` (~85MB)
  - `motion_extractor.pth` (~45MB)
  - `face_analysis/` (InsightFace landmark detector)
- **MediCare Integration Strategy:** Used to drive subtle, natural **attentive listening**, eye blinks (every 2.8s–4.5s), and conversational head tilts during patient turns.

### B. MuseTalk (`MuseTalk/`)
- **Key Capabilities:** Latent diffusion audio-driven inpainting of the mouth region; preserves 100% of upper face, eyes, hair, clothing, and background. Runs real-time (>30 FPS on CUDA, ~8-12 FPS on Apple Silicon MPS/CPU).
- **Dependencies:** `diffusers>=0.24.0`, `accelerate`, `whisper`, `soundfile`, `ffmpeg`.
- **Pretrained Weights Required:**
  - `musetalkV15/unet.pth` (~1.4GB)
  - `sd-vae-ft-mse/` (~335MB)
  - `whisper/tiny.pt` (~75MB)
  - `dwpose/` (~120MB)
- **MediCare Integration Strategy:** Used as the **real-time lip-synchronizer** when the doctor speaks clinical responses.

### C. EchoMimic V3 (`echomimic_v3/`)
- **Key Capabilities:** Advanced portrait animation with multi-modal audio and expression control. High visual quality, but requires 16GB+ VRAM and 1.5–3 seconds per second of generated video.
- **MediCare Integration Strategy:** Configured as the **high-quality asynchronous rendering engine** for offline clinical report summaries and tele-consultation video recordings.

---

## 3. Hardware Constraints & Deployment Strategy
- **MacBook Air M5 (Local Development):**
  - Live client-side neural deformation (HTML5 Canvas + WebGL 60 FPS) provides instantaneous interactive feedback (< 50ms).
  - Python adapters provide standard REST & WebSocket interfaces for integration testing.
- **NVIDIA GPU Server (Production Cloud):**
  - RunPod / AWS A10G (24GB VRAM): LivePortrait and MuseTalk are loaded concurrently (Total VRAM: ~6.3GB), serving 60 FPS WebRTC video streams to the frontend.

