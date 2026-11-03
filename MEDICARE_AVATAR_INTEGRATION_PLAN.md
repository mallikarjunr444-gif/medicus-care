# MEDICARE™ AVATAR INTEGRATION & BENCHMARK PLAN
**Document Version:** 1.0.0  
**Date:** November 3, 2026  
**Architect:** Senior AI Infrastructure & Computer Vision Specialist  
**Target Hardware:** Local Apple Silicon (MacBook Air M5, 16GB Unified RAM) & Production NVIDIA Tensor Core GPU (RTX 4090 / A10G / L4)

---

## 1. Candidate Model Benchmark & Licence Matrix

| Candidate Model | Primary Specialization | Code Licence | Weights / Commercial Restrictions | Inference Speed | Local M5 (MPS) Feasibility | Production GPU Requirement | Selected Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LivePortrait** | Natural head motion, eye gaze, blinking | MIT | Research / Non-Commercial Weights by Kling | 30–60 FPS | Feasible via ONNX / Torch MPS | 4GB VRAM (Low) | **Primary Idle & Listening** |
| **MuseTalk** | Real-Time audio-driven lip synchronization | MIT | CC-BY-NC 4.0 | 30+ FPS (Real-Time) | Feasible on CPU / MPS (<120ms chunk) | 4GB VRAM | **Primary Real-Time Lip-Sync** |
| **EchoMimic V3** | Editable multimodal portrait animation | Apache 2.0 | Apache 2.0 (Permissive) | ~10–18 FPS (Diffusion) | Too heavy for live streaming on M5 | 16GB VRAM | **Batch Clinical Generation** |
| **EchoMimic (V1)** | Audio-driven landmark diffusion | Apache 2.0 | Apache 2.0 | ~8–12 FPS | High Latency on CPU | 12GB VRAM | Alternate Speech Model |
| **AniPortrait** | Audio-to-audio portrait video | Apache 2.0 | Open Weights | ~6–10 FPS | High Latency on CPU | 12GB VRAM | Research Evaluation |
| **PersonaLive** | Personalized video generation | Academic | Strictly Non-Commercial | ~5–8 FPS | Not suitable for real-time | 24GB VRAM | Excluded from Production |
| **Hallo3** | High-fidelity portrait generation | Apache 2.0 | Open-Source | ~4–8 FPS | High Latency | 24GB VRAM | High-Fidelity Showcase |

---

## 2. Production Selected Architecture: The Hybrid Modular Pipeline

To deliver **instantaneous response (<1.2s)** with zero subscription fees:
1. **Listening / Thinking Animation:**  
   **LivePortrait** delivers real-time eye blinking, micro-nods, and attentive gaze shifts without consuming heavy GPU diffusion passes.
2. **Speaking Animation:**  
   **MuseTalk V1.5** drives exact phoneme-to-mouth viseme synthesis synchronized with generated speech audio chunks.
3. **Local Hybrid Client Streamer (Apple Silicon M5):**  
   While heavy PyTorch CUDA inference runs in cloud microservices or Docker containers, the frontend provides immediate, zero-lag **60 FPS Neural Canvas Deformer** and **Three.js WebGL rendering**, ensuring the user never experiences a frozen screen or connection drop.

---

## 3. Directory Layout in Existing Project

```
services/
  avatar-engine/
    app/
      main.py
      doctor_profiles/
        dr_arjun.json
        dr_ananya.json
      models/
        base_adapter.py
        liveportrait_adapter.py
        musetalk_adapter.py
        echomimic_adapter.py
      pipeline/
        animation_pipeline.py
    requirements.txt
    models/
      LivePortrait/
      MuseTalk/
      echomimic_v3/
      echomimic/
      AniPortrait/
```

---

## 4. Hardware & GPU Sizing Guide

- **MacBook Air M5 (16GB RAM):**
  - Runs local FastAPI server and client-side 60 FPS neural canvas animation.
  - Can run MuseTalk on quantized ONNX CPU runtime (~180ms inference per audio slice).
- **Production Cloud Deployment (AWS / GCP / RunPod):**
  - **Recommended GPU:** NVIDIA A10G (24GB VRAM) or RTX 4090 ($0.45 - $0.75/hr).
  - **Docker Base:** `nvidia/cuda:12.1.1-runtime-ubuntu22.04`.
  - **VRAM Allocation:** LivePortrait (2.5GB) + MuseTalk (3.8GB) = **6.3GB VRAM Total** (Both fit simultaneously in a single 16GB/24GB GPU without swapping).

