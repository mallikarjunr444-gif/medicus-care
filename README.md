# MediCare — Your AI Healthcare Companion 🩺

> **Parent Brand:** Medicus Labs™ (Founder & CEO: Mallikarjun R)  
> **Primary Website:** [medicuslabs.app](https://medicuslabs.app)  
> **Public deployment:** DNS and GPU hosting are not configured yet. See [`DEPLOY_WORLDWIDE.md`](DEPLOY_WORLDWIDE.md) for the HTTPS deployment setup.
> **Repository:** [github.com/mallikarjunr444-gif/medicus-care](https://github.com/mallikarjunr444-gif/medicus-care)  

---

## 🌟 Executive Summary

**MediCare** is an advanced, multilingual, AI-powered healthcare consultation platform engineered with two independent clinical intelligence modules:

1. **AI General Physician (Dr. Smit, M.D.)**: Specializing in primary care symptom triage, duration/severity assessment, differential possibilities, home care hydration, and red-flag identification.
2. **AI Psychologist / Mental Wellness Companion (Dr. Ananya, M.D.)**: Specializing in supportive stress management, guided 4-4-4 box breathing, sleep hygiene, emotional validation, and 24/7 crisis escalation.

Unlike text-only healthcare chatbots or stylized cartoon avatars, MediCare features an **authentic photorealistic human AI doctor** participating in a live video consultation with natural eye contact, physiological blinking (every 2.8–4.5s), sinusoidal breathing (14 breaths/min), attentive listening posture, and audio-synchronized mouth visemes.

---

## 👩‍⚕️ Meet the MediCare Doctors

| Dr. Smit — AI General Physician | Dr. Ananya — AI Mental Wellness Companion |
|:---:|:---:|
| <img src="frontend/public/doctor/dr_arjun.jpg" alt="Dr. Smit, MediCare AI General Physician" width="420"> | <img src="frontend/public/doctor/dr_ananya.jpg" alt="Dr. Ananya, MediCare AI Mental Wellness Companion" width="420"> |

These are the reference portraits used for MediCare's doctor experience.

---

## 🧠 Dual-Collection Unified RAG Knowledge Architecture

MediCare separates patient-facing medical facts from mental health counseling dialogues using two isolated vector collections:

1. **Medical Knowledge Collection**:
   * Sourced from **MedQuAD** (11,274 NIH & MedlinePlus clinical guides) across symptoms, disease etiologies, preventive care, first-aid, and laboratory diagnostic tests.
   * Cross-referenced with **Google MedGemma** clinical prompt architectures.
   * Strictly isolates entrance exam datasets (**MedMCQA**) to offline benchmarking only.
2. **Mental Wellness Knowledge Collection**:
   * Sourced from **ESConv** (1,300 emotional support dialogues), **Cogni-OpenModel** (8,500 counseling turns), **CACTUS** (CBT prompt protocols), and **Psy-Insight**.
   * Structured for empathetic validation, OARS motivational interviewing, and rational thought challenging without claiming licensed psychotherapy.

---

## 🛡️ Medical Safety & Crisis Escalation Engine

Deterministic 4-level clinical triage screener running inline on every patient turn:

* **Level 1 (General Guidance)**: Preventive health education, hydration, rest.
* **Level 2 (Assessment Advised)**: Non-urgent evaluation advised for persistent symptoms (>48 hours).
* **Level 3 (Urgent Review)**: Priority outpatient clinical evaluation recommended.
* **Level 4 (Emergency Red Alert)**: Severe chest pain, respiratory distress, stroke signs (FAST), unconsciousness, or suicidal crisis immediately halts normal conversation, triggers a red alert banner, and connects to emergency hotlines:
  * **National Emergency Hotline (India)**: Dial **112** / **108**.
  * **National Mental Health Helpline (KIRAN)**: Dial **1800-599-0019** (24/7 Toll-Free).
  * **Tele-MANAS**: Dial **14416** or **1800-891-4416**.

### Clinical Boundary Enforcement:
* **No Autonomous Prescriptions**: Pattern filters strictly block Schedule H/X drug recommendations and dosages.
* **No Definitive Diagnoses**: Diagnoses are phrased as differential educational possibilities.
* **Permanent AI Disclosure**: Prominent badges and clinical disclaimers confirm AI assistant status.

---

## 🗣️ Multilingual Voice & Speech Pipeline

* **Supported Languages**: English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी).
* **Speech-to-Text (STT)**: `faster-whisper` (`large-v3-turbo`) with CTranslate2 for ultra-fast medical transcription, with `AI4Bharat IndicConformer` for vernacular Indian dialects.
* **Text-to-Speech (TTS)**: English keeps the existing configured voice path. Hindi and Kannada route to a separately self-hosted AI4Bharat/Bodhan Indic-Speak worker (`Amit`/`Kavya`; `Adarsh`/`Deepika`) and never silently fall back to an English or hosted voice. See [`documentation/indic_speak_local_setup.md`](documentation/indic_speak_local_setup.md).
* **Voice Activity Detection (VAD)**: Real-time neural speech boundary detection using local ONNX `silero-vad` (5-10ms latency) supporting instant barge-in interruption.

---

## 🖥️ MediCare Admin Knowledge Console

Administrators can navigate to `/` and select the **Admin Console** tab:
* **Knowledge Explorer**: Browse, inspect, approve, or reject chunks across Medical and Mental Wellness collections.
* **Document Ingestion**: Upload PDF, DOCX, TXT, CSV, or JSON reference documents staged as *Pending Review* until clinician sign-off.
* **Repository & License Tracker**: Audit all 15 open-source repositories under `medicus-ai-data/`.
* **Safety Evaluation Suite**: Run automated safety probes against CRADLE-Dialogue, Between Help & Harm, and NOPE Evals with live pass-rate metrics.

---

## 📚 Master Deliverables & Reports

All formal documentation deliverables are maintained in [`documentation/`](documentation/):

1. [`dataset_inventory.csv`](documentation/dataset_inventory.csv) — Complete audit of all 15 repositories, licenses, and file counts.
2. [`dataset_summary.json`](documentation/dataset_summary.json) — Machine-readable summary of datasets and domain splits.
3. [`licence_report.md`](documentation/licence_report.md) — Legal IP and open-source license governance report.
4. [`data_quality_report.md`](documentation/data_quality_report.md) — Extraction, parsing, and deduplication quality metrics.
5. [`model_comparison.md`](documentation/model_comparison.md) — Evaluation of MedGemma, Qwen 2.5, Cogni-OpenModel, and Llama 3.1.
6. [`voice_quality_report.md`](documentation/voice_quality_report.md) — Empirical audio quality evaluation across English, Kannada, and Hindi.
7. [`clinical_safety_report.md`](documentation/clinical_safety_report.md) — Red-teaming and safety benchmark evaluation results.
8. [`architecture.md`](documentation/architecture.md) — System architecture diagram and WebRTC data flow.
9. [`deployment_guide.md`](documentation/deployment_guide.md) — Production AWS EC2 GPU deployment and local Mac Apple Silicon guide.
10. [`DEPLOY_WORLDWIDE.md`](DEPLOY_WORLDWIDE.md) — HTTPS, GPU-hosted models, and multi-device production setup.
11. [`documentation/README.md`](documentation/README.md) — Documentation index and master reference guide.

---

## 🚀 Quick Start (Local Apple Silicon Mac)

### 1. Backend Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Hindi/Kannada TTS (local worker required for those languages)

Follow [`documentation/indic_speak_local_setup.md`](documentation/indic_speak_local_setup.md)
to run the gated Indic-Speak weights in an isolated Python environment. The
main backend's Torch/Transformers environment is intentionally unchanged.

---

## ⚖️ Clinical & Regulatory Notice

MediCare is an artificial intelligence pre-screening and healthcare educational platform. It is not an autonomous licensed doctor. No clinical diagnosis, prescriptions, or regulated medical services are provided autonomously. Regulated medical services must remain under qualified human medical practitioners. In acute medical emergencies, dial **112** (India) immediately.

---

## 📄 License

Proprietary — Medicus Labs™ © 2026. All rights reserved.
