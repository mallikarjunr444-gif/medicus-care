# Medicus Care™ — Photorealistic Interactive AI Doctor Upgrade Report

> **Product:** Medicus Care (Your AI Healthcare Companion)  
> **Parent Brand:** Medicus Labs™ (Founder & CEO: Mallikarjun R)  
> **Production Subdomain:** [care.medicuslabs.app](https://care.medicuslabs.app)  
> **Primary Brand Website:** [medicuslabs.app](https://medicuslabs.app)  
> **Location Context:** Chikkamagaluru, Karnataka, India  
> **Release Date:** November 2026

---

## 1. Executive Summary

Medicus Care has been upgraded from a static avatar into a **central interactive AI healthcare assistant** featuring the photorealistic human doctor (Dr. Arjun, M.D.) and mental wellness consultant (Dr. Ananya, M.D.).

The upgrade integrates:
* Natural voice dialogue with speech recognition and instant interruption (barge-in).
* Trilingual support (**English**, **Kannada [ಕನ್ನಡ]**, and **Hindi [हिन्दी]**) with automatic language detection.
* Controlled agentic application tool calling (specialist directory lookups, appointment booking requests, laboratory report interpretation, and health reminders).
* Localized healthcare pathways for **Chikkamagaluru & Karnataka, India** (District Hospital Chikkamagaluru, 108 Arogya Kavacha, 112 National Emergency, and KIRAN 1800-599-0019).
* Complete isolation from the parent Medicus Labs dermatology database.

---

## 2. Working Features Matrix

### A. Existing Working Features Preserved

| Feature | Technical Implementation | Operational Status |
|---|---|---|
| **Photorealistic Doctor Visual Identity** | High-resolution portrait of young male doctor with natural curly dark hair, spectacles, stethoscope, white medical coat, and striped shirt in a modern clinical suite. | ✅ **100% Preserved** (`Friendly Doctor in a Modern Consultation Office.png`) |
| **Physiological Micro-Animation** | WebGL/Canvas viewport (`DoctorPhotorealisticViewport.tsx`) simulating natural eye contact, physiological blinking (2.8–4.5s intervals), sinusoidal breathing (14 breaths/min), and mouth visemes. | ✅ **Active** |
| **Telemedicine 70/30 Layout** | Desktop 70% doctor video viewport + floating patient webcam PiP, 30% clinical transcript sidebar, and touch-friendly mobile full-screen view. | ✅ **Active** |
| **Dual Consultation Modes** | Instant mode switching between **AI General Physician (Dr. Arjun)** and **AI Mental Wellness (Dr. Ananya)**. | ✅ **Active** |
| **Dual-Collection RAG Engine** | PostgreSQL (`rag_service.py`) dual collections: 300+ MedQuAD clinical guides and 119 ESConv/CACTUS emotional support protocols. | ✅ **Active** |
| **Deterministic Safety Triage** | 4-tier triage screener (`safety_validator.py`) with Level 4 Emergency detection, one-touch **112** calling, and autonomous prescription blocking. | ✅ **Active** |
| **Structured Clinical Notes** | Compliant with PRD Section 20: patient-reported symptoms, differential possibilities, home care steps, and downloadable consultation summaries. | ✅ **Active** |

---

### B. Newly Implemented Agentic Capabilities

| Agentic Feature | Implementation Location | User Interaction Flow |
|---|---|---|
| **Controlled Tool-Calling Engine** | [`backend/app/services/doctor_agent.py`](file:///Users/malikarjunr/medicus-care/backend/app/services/doctor_agent.py) | Analyzes patient messages for intent (doctor search, appointments, reports, mode switches). |
| **Doctor Actions REST API** | [`backend/app/api/v1/doctor_actions.py`](file:///Users/malikarjunr/medicus-care/backend/app/api/v1/doctor_actions.py) | `/intent/check`, `/specialists`, `/appointments/request`, `/reports/analyze`. |
| **Specialist Search & Booking Modal** | [`frontend/components/doctor/SpecialistBookingModal.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/doctor/SpecialistBookingModal.tsx) | Localized directory of verified doctors in Chikkamagaluru & Karnataka; requires explicit patient authorization before booking. |
| **Interactive Specialist Action Cards** | [`frontend/components/doctor/DoctorVideoCall.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/doctor/DoctorVideoCall.tsx) | Directly rendered inside the transcript when the doctor recommends human physician evaluation. |
| **Interactive 4-4-4 Box Breathing Card** | [`frontend/components/doctor/DoctorVideoCall.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/doctor/DoctorVideoCall.tsx) | Visual breathing pacer (Inhale 4s → Hold 4s → Exhale 4s) triggered during stress consultations. |
| **Automatic Language Detection** | [`frontend/components/doctor/DoctorVideoCall.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/doctor/DoctorVideoCall.tsx) | Zero-latency Unicode script detection: typing/speaking in Kannada (`kn`) or Hindi (`hi`) smoothly updates doctor voice and responses. |
| **Microphone Speech Recognition** | [`frontend/components/doctor/DoctorVideoCall.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/doctor/DoctorVideoCall.tsx) | Continuous listening with one-click mic toggle and speech-to-text input. |
| **Admin Knowledge & Safety Console** | [`frontend/components/admin/AdminKnowledgeDashboard.tsx`](file:///Users/malikarjunr/medicus-care/frontend/components/admin/AdminKnowledgeDashboard.tsx) | Document ingestion (PDF/DOCX/CSV), approval workflow, repository auditing, and safety benchmark runner. |

---

## 3. Localized Regional Healthcare Pathways (Chikkamagaluru, Karnataka, India)

When patient symptoms require physical evaluation or specialized clinical follow-up, the AI doctor recommends verified regional institutions:

1. **District Hospital Chikkamagaluru**:
   * **Specialties**: General Medicine, Emergency Medicine, Trauma Care.
   * **Address**: MG Road, Chikkamagaluru, Karnataka 577101.
   * **Contact**: +91 8262 230230.
2. **Chikkamagaluru Institute of Medical Sciences (CIMS) Hospital**:
   * **Specialties**: Pulmonology, Pediatrics, Obstetrics & Gynecology, Critical Care.
   * **Address**: Kadur-Mangalore Road, Chikkamagaluru, Karnataka 577102.
3. **District Mental Health Programme & Clinic**:
   * **Specialties**: Clinical Psychiatry, Psychological Counseling, De-Addiction.
   * **Address**: District Health Office Compound, Chikkamagaluru.
4. **State-Level Emergency Medical Hotlines**:
   * **National Unified Emergency**: **112**.
   * **Arogya Kavacha Karnataka Ambulance**: **108**.
   * **National Mental Health Helpline (KIRAN)**: **1800-599-0019** (24/7 Toll-Free).
   * **Tele-MANAS Karnataka**: **14416** / **1800-891-4416**.

---

## 4. Features Requiring External Infrastructure for Scale

| Component | Current Local Development Implementation | Production Infrastructure Requirement |
|---|---|---|
| **Real-Time Video Lip-Sync** | High-fidelity canvas micro-motion + viseme synchronization on Apple Silicon macOS. | NVIDIA A10G / L4 (24GB VRAM) on AWS `g5.xlarge` running MuseTalk persistent worker at 30 FPS. |
| **High-Performance Indic TTS** | Edge-TTS neural voices (`en-US-Aria`, `hi-IN-Swara`, Kannada voice) and Web Speech API. | AI4Bharat IndicF5 model weights (hosted on Hugging Face) deployed on dedicated PyTorch GPU worker. |
| **Vernacular Speech Recognition** | `faster-whisper` on Mac CPU/MPS and Web Speech API. | AI4Bharat IndicConformer ASR running inside NVIDIA NeMo v2 container for heavy code-switching. |
| **SMS / WhatsApp Booking Alerts** | Local application notification cards. | Twilio or Gupshup SMS gateway credentials configured in `.env.prod`. |

---

## 5. Clinical Safety Limitations & Boundary Guardrails

1. **Strict Prohibition on Autonomous Prescriptions**:
   * The AI doctor cannot issue, recommend, or modify pharmaceutical prescriptions (Schedule H/X drugs) or specific dosages.
   * Recommends clinical evaluation by a registered medical practitioner.
2. **Differential Educational Possibilities**:
   * Never makes definitive diagnostic claims; phrases assessments probabilistically (*"These symptoms could be consistent with..."*).
3. **Mental Wellness Boundaries**:
   * Dr. Ananya acts strictly as an educational wellness companion, not a licensed clinical psychologist or therapist.
4. **Emergency Override**:
   * Critical red flags (chest pain, dyspnea, stroke FAST signs, suicidal crisis) immediately override dialogue and activate emergency hotlines.

---

## 6. Verification & Outstanding Status

* **TypeScript Compilation**: Clean pass (`npm run typecheck` returned 0 errors).
* **Git Status**: All changes staged and committed on branch `main` (`c07bddd`).
* **Parent Brand Isolation**: Medicus Care operates under its independent database schema, separate environment variables, and dedicated routing for [care.medicuslabs.app](https://care.medicuslabs.app/).
