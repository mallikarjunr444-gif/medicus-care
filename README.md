# Medicus Care — Your AI Doctor 🩺

> **Parent Company:** Medicus Labs™  
> **Primary Platform:** Responsive Web Application  
> **Production Domain:** [care.medicuslabs.app](https://care.medicuslabs.app)  
> **Repository:** [github.com/mallikarjunr444-gif/medicus-care](https://github.com/mallikarjunr444-gif/medicus-care)  

---

## 🌟 Executive Summary

**Medicus Care** is an AI-powered digital healthcare platform delivering interactive, real-time healthcare assistance through realistic **3D virtual human AI doctors**.

Unlike conventional text-only healthcare chatbots, Medicus Care provides a telemedicine video-consultation experience where patients interact with virtual doctors through natural voice, facial expressions, eye contact, and medical document uploads.

---

## 👨‍⚕️ 3D Virtual Doctor Identities

| Doctor | Identity | Specialty | Appearance & Environment |
|---|---|---|---|
| **Dr. Arjun, M.D.** | Male AI Avatar | AI General Physician | White medical lab coat, clinical stethoscope, cyan scrubs, consultation suite |
| **Dr. Ananya, M.D.** | Female AI Avatar | General Physician & Wellness Consultant | White medical lab coat, clinical stethoscope, royal blue scrubs, consultation suite |

### 3D Avatar Capabilities (Phase 2):
* **Realtime WebGL 3D Rendering**: Built on Three.js with realistic skin shaders, warm clinical lighting, and half-body telemedicine framing.
* **Articulated Blendshapes & Visemes**: Mouth opening (`mouthOpen`, `jawOpen`) and vowel visemes (`viseme_aa`, `viseme_E`, `viseme_O`, `viseme_I`, `viseme_U`) dynamically modulated by speech audio.
* **Physiological Eye Blinking**: Randomized natural blinks every 2.8–4.5 seconds with micro-saccadic gaze tracking.
* **Breathing Cycle**: Natural sinusoidal chest and shoulder rise/fall at 14 breaths/min.
* **Dynamic Interaction States**:
  * `idle`: Relaxed breathing, periodic natural blinks, subtle eye drift.
  * `listening`: Attentive forward head tilt, direct eye contact on patient, affirmative micro-nods.
  * `thinking`: Upward-side glance, head tilt, brow furrow, clinical processing indicator.
  * `speaking`: Conversational head motion, empathetic brow movement, syllable-synchronized lip motion.
  * `interrupted`: Immediate speech freeze, head recoil, transitions swiftly back to listening.
  * `explaining`: Warm reassuring nods, friendly smile.

---

## 🚀 Key Modules & Features

### 1. Telemedicine 70/30 Video Consultation
* **70% Main Video Area**: Three.js 3D Doctor Canvas with patient webcam preview (Picture-in-Picture with camera on/off controls) and live audio subtitle bar.
* **30% Right Clinical Sidebar**: Live conversation transcript, quick health inquiries, and report analyzer.

### 2. Multilingual Healthcare
* Full voice and text support in:
  * **English**
  * **Kannada (ಕನ್ನಡ)**
  * **Hindi (हिन्दी)**

### 3. Medical Safety & Escalation Engine
Deterministic 4-level triage classifier:
* **Level 1**: General healthcare information and preventive education.
* **Level 2**: Medical assessment recommended for persistent symptoms.
* **Level 3**: Urgent medical review recommended.
* **Level 4 (Emergency)**: Suspected life-threatening symptoms trigger an immediate red alert with one-tap dialing for Indian Emergency Services (**112** / **108**).

### 4. Medical Report Intelligence
* Supports PDF, JPG, PNG uploads of diagnostic laboratory tests.
* Parameter extraction for:
  * Complete Blood Count (CBC)
  * Fasting Blood Sugar & HbA1c
  * Thyroid Profile (TSH, T3, T4)
  * Lipid Profile & Metabolic Panels
* Flags high/low results and presents preliminary physician explanations.

### 5. Structured Consultation Summary
* Compliant with PRD Section 20: generates structured clinical notes separating patient-reported symptoms from AI interpretations.
* Export and print support with mandatory clinical disclaimer.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS |
| **3D Rendering** | Three.js WebGL, GLTFLoader, Blendshapes & Morph Targets |
| **Realtime Audio/Video** | WebRTC, LiveKit, Web Audio API Analyzer |
| **Speech Engine** | Whisper / IndicConformer STT, Indic-Parler-TTS, Web Speech API |
| **Backend** | Python FastAPI, Pydantic, SQLAlchemy |
| **Database & Cache** | PostgreSQL, pgvector, Redis, Celery |
| **AI Models** | Qwen, MedGemma |

---

## 📦 Getting Started

### Prerequisites
* **Node.js** >= 20.9.0
* **Python** >= 3.10
* **Docker & Docker Compose** (optional for containerized deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/mallikarjunr444-gif/medicus-care.git
cd medicus-care
```

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Full Docker Compose Deployment
```bash
docker compose up -d --build
```

---

## ⚖️ Regulatory & Medical Safety Notice

Medicus Care is an AI-powered healthcare assistant designed to provide general health education and preliminary symptom guidance. **It is not an autonomous licensed doctor.** No clinical diagnosis, prescriptions, or regulated medical services are provided autonomously. Regulated medical services must remain under qualified human medical professionals. In medical emergencies, dial **112** (India) immediately.

---

## 📄 License

Proprietary — Medicus Labs™ © 2026. All rights reserved.
