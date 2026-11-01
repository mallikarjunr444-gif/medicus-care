# Medicus Care™ — System Architecture & Engineering Blueprint

> **Parent Brand:** Medicus Labs™ (Founder: Mallikarjun R)  
> **Product Positioning:** Medicus Care — Your AI Doctor  
> **Production Subdomain:** [care.medicuslabs.app](https://care.medicuslabs.app)  
> **Parent Website:** [medicuslabs.app](https://medicuslabs.app)

---

## 1. System Architecture Overview

Medicus Care is an independent digital health platform engineered to provide photorealistic video consultations with an AI Doctor. Unlike text-based chatbots or synthetic 3D avatars, Medicus Care uses open-source photo-driven neural rendering (MuseTalk), speech-to-text (Whisper), localized LLMs (Qwen 2.5 via Ollama), and neural TTS to deliver a live video call experience.

```
┌────────────────────────────────────────────────────────────────────────┐
│               PATIENT CLIENT BROWSER (Desktop & Mobile)                │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Doctor Video Viewport (70%)  │  │   Clinical Sidebar (30%)      │  │
│  │  - Photorealistic Doctor Video│  │   - Live Consultation Transcript││
│  │  - Floating Patient Webcam PiP│  │   - 4-Tier Safety Level Alert │  │
│  │  - Real-time Subtitles        │  │   - Quick Symptom Inquiries   │  │
│  │  - Live Call Timer            │  │   - Diagnostic Report Analysis│  │
│  └──────────────┬────────────────┘  └───────────────┬───────────────┘  │
│                 │ Audio / Video Stream              │ WebSocket Events │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND API                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  WebSocket Connection & Session Manager                          │  │
│  │  - Barge-in Cancellation Token Controller                        │  │
│  │  - Audio Buffer & VAD (Voice Activity Detection) Streamer        │  │
│  │  - Video Chunk Sequencing & Client Buffer Control                │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│      ┌──────────────────────────────┼───────────────────────────┐      │
│      ▼                              ▼                           ▼      │
│ ┌───────────────┐           ┌───────────────┐           ┌────────────┐ │
│ │  STT Engine   │           │ Medical Safety│           │ LLM Engine │ │
│ │  Whisper /    │──────────►│ Triage & Guard│──────────►│ Qwen 2.5   │ │
│ │  faster-whis  │           │ Level 1 - 4   │           │ via Ollama │ │
│ └───────────────┘           └───────────────┘           └─────┬──────┘ │
│                                                               │        │
│                                                               ▼        │
│ ┌───────────────┐           ┌───────────────┐           ┌────────────┐ │
│ │ Video Stream  │           │ Avatar Engine │           │ TTS Engine │ │
│ │ Video Chunk / │◄──────────│ MuseTalk V1.5 │◄──────────│ Chatterbox/│ │
│ │ WebRTC Pipe   │           │ Worker (FP16) │           │ Edge-TTS   │ │
│ └───────────────┘           └───────────────┘           └────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Consultation Lifecycle

1. **Intake & Consent**:
   - Patient grants microphone and optional camera permission with transparent AI disclosure.
2. **Patient Speech Capture**:
   - Client captures 16kHz audio with hardware echo cancellation.
   - Streamed via WebSocket or processed upon VAD pause (700-900ms silence).
3. **Speech Recognition**:
   - `faster-whisper` decodes audio to text, supporting English, Kannada, and Hindi.
4. **Clinical Safety & Triage Validation**:
   - `medical-safety/safety_validator.py` checks for emergency red flags (Level 4: chest pain, severe dyspnea, stroke signs, anaphylaxis).
   - If emergency detected: interrupts turn, activates emergency banner with **112** (National Emergency Number, India).
   - If non-emergency: evaluates symptoms and bounds AI responses to educational differential guidance (no autonomous drug prescriptions).
5. **Medical AI Inference**:
   - Qwen 2.5 (via Ollama or local endpoint) formats an empathetic, clinical response.
6. **Voice Synthesis**:
   - Neural TTS (Chatterbox / Edge-TTS) synthesizes audio into 24kHz/16-bit WAV.
7. **Photorealistic Video Lip-Sync Generation**:
   - `avatar-engine/pipeline.py` (MuseTalk worker) aligns speech phonemes to doctor facial landmarks on the doctor portrait reference.
   - Generates synchronized MP4 video chunks.
8. **Client Display & Live Interaction**:
   - Video chunks are seamlessly buffered and played in the 70% doctor video viewport.
   - Transcript and structured consultation summary update in real time.
   - Instant barge-in: patient speaking cancels current playback and starts fresh turn.

---

## 3. Hardware Requirements: Local Development vs Production

| Tier | Development (MacBook Apple Silicon) | Production (Cloud GPU) |
|---|---|---|
| **Platform** | Apple Silicon (M1/M2/M3/M4) macOS | AWS EC2 `g5.xlarge` / `g6.xlarge` Ubuntu 22.04 LTS |
| **GPU / VRAM** | Unified Memory (MPS / CPU execution) | NVIDIA A10G (24 GB VRAM) or L4 (24 GB) with CUDA 11.8+ |
| **Inference Mode** | CPU-compatible fallback mode + frame interpolation | PyTorch FP16 Tensor Core accelerated (~30 FPS real-time) |
| **LLM Inference** | Ollama with Qwen 2.5 (3B / 7B quantized 4-bit) | Ollama / vLLM with Qwen 2.5 (14B / 32B FP16) |
| **STT** | `faster-whisper` (base / small) on CPU/MPS | `faster-whisper` (large-v3-turbo) on CUDA |
| **TTS** | Edge-TTS / Piper TTS (CPU) | Chatterbox Multilingual (cloned doctor voice, GPU) |

---

## 4. Medical Safety & Regulatory Compliance

- **Telemedicine Practice Guidelines (NMC / MoHFW India)**:
  - Clear AI identity disclosure at session initialization.
  - Strict prohibition of autonomous Schedule H/X pharmaceutical prescriptions.
  - Mandatory human physician referral recommendations.
- **DPDP Act (India 2023) & HIPAA Alignment**:
  - Zero storage of unencrypted patient audio.
  - Strict ephemeral processing mode option.
  - AES-256 encryption at rest; TLS 1.3 in transit.
  - Separate database namespace from parent Medicus Labs dermatology platform.
