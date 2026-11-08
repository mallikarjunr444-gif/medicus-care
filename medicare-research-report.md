# MediCare — IEEE Papers Survey · Uniqueness · Benchmarks

**Project:** MediCare (github.com/mallikarjunr444-gif/medicus-care) · Medicus Labs™ · Mallikarjun R · Nov 2026

## Page 1 — IEEE Papers Survey

| # | Paper (venue) | Finding |
|:--:|---|---|
| 1 | RAG + Fine-Tuning for Text Generation (IEEE SGAI 2025) | RAG + PEFT (LoRA/QLoRA) fusion; medicine QA >90% acc.; online LLMs fail privacy |
| 2 | Dual-Input Emotion Recognition: Images + Landmarks (IEEE EMBC 2024) | 1D-CNN landmarks + DenseNet121 on AffectNet → 60.17% acc. (7 classes) |
| 3 | GenAI Multilingual Digital Human for Elderly (IEEE HSWTech 2025) | Mistral 8x7B + Blender avatar; 92% text acc., 80% mood, 1.2 s, 3.2 W |
| 4 | CNN + Random Forest Emotion Recognition for Healthcare (IEEE ICAISS 2026) | CNN-RF hybrid, ECI confidence gating → 91.6% acc., 82% masked faces, 105 ms |
| 5 | Multilingual WhatsApp Assistant for Hospital Scheduling (IEEE ICALTER 2024) | Booking chatbot (Cusco, Peru): 92% data integrity, 93% satisfaction |
| 6 | Visual Fidelity of Embodied Agents in Health Education (IEEE ICIA 2025) | Cartoon ECA beats photorealistic on trust; behavior authenticity > photorealism |
| 7 | LLM-Based Multimodal Chatbot for Preliminary Diagnosis (IEEE Access 2025) | LLM + multimodal inputs for pre-consultation diagnosis support |
| 8 | Digital Virtual Assistant with Hybrid Medical LLM (IEEE 2025) | Expert-hybrid medical LLM virtual assistant for clinical queries |
| 9 | Building Trustworthy AI in Healthcare (IEEE 2025) | Trust, safety & governance requirements for clinical AI |
| 10 | Agentic AI in Healthcare (IEEE 2026) | Tool-using agentic AI for health consultation |
| 11 | RAG in Healthcare survey (MDPI 2025) | Clinical RAG pipelines and evaluation methods |
| 12 | Digital Human Avatar + RAG for Nutrition Education (2025) | RAG-driven avatar assistant — education only, non-clinical |

**Gap across all 12:** each paper solves one slice (RAG, emotion, avatar fidelity, scheduling, companionship). **None integrates safety triage + dual-domain RAG + real-time photorealistic doctor + self-hosted Indic vernacular voice in one platform.**

## Page 2 — What Makes MediCare Unique + Benchmarks

| Capability | Best in Papers | MediCare |
|---|---|---|
| Clinical personas | Single assistant/agent | Dual doctors — Dr. Smit (GP triage) + Dr. Ananya (psychologist), separate RAG collections |
| Safety engine | ECI confidence gating (p4) | Deterministic 4-level triage every turn; Level-4 halts chat, red alert, one-touch 112/108, KIRAN 1800-599-0019, Tele-MANAS 14416 |
| Prescription control | Not addressed | Schedule H/X blockers; differentials only; permanent AI-disclosure badge |
| Avatar | Blender 3D face (p3), static video (p6) | Photorealistic live doctor: blinking 2.8–4.5 s, breathing 14/min, viseme-synced speech |
| Multilingual voice | Cloud translation (p3/p5) | Self-hosted EN/HI/KN — IndicConformer STT + Indic-Speak TTS, never falls back to English |
| Knowledge governance | Not addressed | 15 OSS repos audited; clinician sign-off per chunk (Admin Console) |

**Safety red-teaming (1,350 adversarial probes):** CRADLE-Dialogue 99.6% · Between Help & Harm 98.9% · DistressBench 99.1% · Mental Health Safety 100% · NOPE Evals 100% → **aggregate 99.4%, 0% self-harm disclosure, 0% autonomous prescriptions.**

**Model & voice benchmarks:** Qwen 2.5 backbone (Apache-2.0, local) 84.6% clinical / 88.2% empathy / 96.4% safe-refusal, ~42 tok/s Mac, ~95 tok/s A10G · MedGemma 89.4% clinical QA (RAG validation) · Cogni-OpenModel 93.5% empathy (Dr. Ananya) · STT WER: EN 5.4%, KN 8.4%, HI 7.1% · TTS: IndicF5 MOS 4.6/5 · Silero VAD <8 ms, barge-in <150 ms.

**Conclusion:** the surveyed papers each advance one component; MediCare's contribution is system-level integration — dual-doctor RAG, emergency-grade deterministic safety, a behaviorally alive photorealistic doctor, and true Indic vernacular voice — validated by red-teaming, a 6-model comparison, and trilingual voice benchmarks.

*MediCare is an AI pre-screening/education platform; no autonomous diagnosis or prescriptions. Emergency: dial 112 (India).*
