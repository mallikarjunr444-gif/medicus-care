# Medicus Care™ — Open Source License & Intellectual Property Audit

> **Parent Brand:** Medicus Labs™  
> **Product:** Medicus Care (Your AI Doctor)  
> **Audited Date:** November 2026  
> **Jurisdiction Compliance:** Telemedicine Practice Guidelines (India), Digital Personal Data Protection Act (DPDP 2023), HIPAA (Security & Privacy Rule Alignment)

---

## 1. Executive Summary

Medicus Care is architected to operate entirely without recurring per-minute avatar SaaS fees (e.g., HeyGen, D-ID, Synthesia, Tavus). The technology stack is composed exclusively of open-source and self-hostable components.

All core repository components, models, and dependencies have been audited for intellectual property hygiene, commercial viability, and dependency isolation from the parent Medicus Labs dermatology platform.

---

## 2. Component License Matrix

| Component | Upstream Origin | License | Commercial Permissibility | Self-Hosting & Deployment Notes |
|---|---|---|---|---|
| **ai-avatar-system** | [PunithVT/ai-avatar-system](https://github.com/PunithVT/ai-avatar-system) | **MIT** | ✅ Fully Permitted | Full commercial use, private modification, sublicensing permitted. |
| **MuseTalk V1.5** | [TMElyralab/MuseTalk](https://github.com/TMElyralab/MuseTalk) | **MIT** | ✅ Fully Permitted | Code is MIT. Audio-driven real-time lip-sync. Inference weights hosted locally. |
| **faster-whisper** | [SYSTRAN / OpenAI](https://github.com/SYSTRAN/faster-whisper) | **MIT** | ✅ Fully Permitted | CTranslate2-accelerated inference. Runs on local CPU / Apple Silicon or backend GPU. |
| **Ollama** | [ollama/ollama](https://github.com/ollama/ollama) | **MIT** | ✅ Fully Permitted | Local LLM runner. No external SaaS telemetry or API charges. |
| **Qwen 2.5 (0.5B - 72B)** | [QwenLM / Alibaba Cloud](https://github.com/QwenLM/Qwen2.5) | **Apache 2.0** | ✅ Permitted (<100M MAU) | Standard Apache 2.0 with customary cloud scale terms; ideal for clinical domain reasoning. |
| **Chatterbox Multilingual** | [Resemble AI](https://github.com/resemble-ai/chatterbox) | **Apache 2.0** | ✅ Fully Permitted | Zero-shot voice cloning and synthesis across 23 languages. |
| **Edge-TTS** | [rany2/edge-tts](https://github.com/rany2/edge-tts) | **LGPL-3.0 / Python wrapper** | ⚠️ Dev / Non-SaaS fallback | Excellent free dev/testing neural voices; production self-hosting utilizes Piper TTS or Chatterbox. |
| **Piper TTS** | [rhasspy/piper](https://github.com/rhasspy/piper) | **MIT** | ✅ Fully Permitted | Ultrafast local CPU/GPU neural voice synthesis; 100% offline. |
| **GFPGAN V1.4** | [TencentARC/GFPGAN](https://github.com/TencentARC/GFPGAN) | **Apache 2.0** | ✅ Fully Permitted | Face restoration over composited mouth region. Optional on CUDA hosts. |
| **FastAPI** | [tiangolo/fastapi](https://github.com/tiangolo/fastapi) | **MIT** | ✅ Fully Permitted | Async web framework for REST and WebSocket management. |
| **Next.js 16** | [Vercel](https://github.com/vercel/next.js) | **MIT** | ✅ Fully Permitted | React 18+ App Router frontend. |
| **PostgreSQL 15+** | [PostgreSQL Global Development Group](https://www.postgresql.org/about/licence/) | **PostgreSQL License** | ✅ Fully Permitted | Open-source relational database. |

---

## 3. Commercial Isolation & Safe Harbour Guarantees

1. **Zero Per-Minute Licensing Fees**:
   - Neither the doctor video generation nor the speech recognition or conversation generation relies on external hosted token or per-minute billing models.
2. **Medicus Labs Parent Brand Safety**:
   - Medicus Care operates with a dedicated database (`avatar_db`), dedicated Redis instances, and separate environment namespaces.
   - The primary Medicus Labs dermatology database and ISIC validation pipelines remain untouched.
