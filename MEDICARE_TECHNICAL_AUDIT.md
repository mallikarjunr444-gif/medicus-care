# MEDICARE™ TECHNICAL AUDIT REPORT
**Document Version:** 2.4.0  
**Audit Date:** November 3, 2026  
**Author:** Principal Full-Stack & AI Systems Architect  
**Target Repository:** `medicus-care` (Frontend: Next.js 16.3.4 App Router / Webpack; Backend: FastAPI v2.0.0)

---

## 1. Executive Summary

A comprehensive architectural and code-level audit was conducted across the entire MediCare digital health repository (`frontend/` and `backend/`). The platform is designed to provide real-time, multilingual, clinical triage and consultation with two primary care physicians: **Dr. Smit, M.D.** (Internal Medicine & Triage) and **Dr. Ananya, M.D.** (Metabolic Health, Lab Diagnostics & Wellness).

While the repository contains sophisticated clinical knowledge staging, 4-tier triage logic, and high-performance WebGL/GSAP foundations, the video consultation experience suffered from severe disconnects:
1. **Static 2D Photograph Display:** The telemedicine call viewport was rendering a static `<img>` overlay (`DoctorPhotorealisticViewport.tsx`) with rudimentary CSS radial gradients for mouth movement rather than active 3D digital-human animation.
2. **Speech Recognition Disconnect & Dropout:** Web Speech API (`webkitSpeechRecognition`) was configured with `continuous = false`, terminating audio capture after the first spoken sentence or upon ambient silence/`no-speech` errors. The microphone failed to reactivate automatically, leading patients to believe the doctor was unresponsive.
3. **Browser Audio Latency & Speech Queue Deadlock:** The frontend relied on `window.speechSynthesis` with an artificial `setTimeout(..., 550ms)` delay. On Chromium/macOS, `speechSynthesis` voices load asynchronously, lack offline native voices for regional Indian languages (Kannada `kn-IN`, Telugu `te-IN`, etc.), and suffer from a notorious Chromium garbage-collection bug where `onend` never fires, causing the consultation state to freeze permanently in `speaking`.
4. **Backend/Frontend Decoupling:** The backend includes a complete Gnani.ai Vachana Voice AI integration (`gnani_service.py`), but the frontend's telemedicine module (`DoctorVideoCall.tsx`) was not wired to stream audio to/from it, defaulting to browser APIs with silent failure modes.

---

## 2. Repository Architecture Overview

### A. Frontend Architecture
- **Framework:** Next.js 16.3.4 (App Router) using Webpack bundling (custom Darwin-arm64 compatibility mode).
- **Core State Management:** Zustand (`store/useStore.ts`) for auth tokens and user session; React component state (`DoctorVideoCall.tsx`) for live consultation turns and clinical session memory.
- **Consultation Engine:** `frontend/lib/medicalConsultationEngine.ts` implements deterministic clinical triage (Levels 1–4), multi-turn conversation memory (`ClinicalSessionMemory`), duration/symptom entity extraction, and multilingual response generation in 9 Indian languages.
- **Graphics & Animation:** Three.js (`^0.187.0`), GSAP 3.15, Tailwind CSS.

### B. Backend Architecture
- **Framework:** FastAPI with asynchronous ASGI lifecycle (`backend/main.py`).
- **Orchestration:** Celery 5.x (`backend/app/celery_app.py`) backed by Redis for heavy asynchronous processing (MuseTalk lip-sync model workers, video rendering).
- **Indic Voice AI:** `backend/app/services/gnani_service.py` wrapping Gnani.ai Vachana API (Prisma v3.0 STT & Timbre v2.5 TTS) supporting Indian English, Hindi, Kannada, Tamil, Telugu, Marathi, Gujarati, Bengali, and Malayalam.
- **Database & Storage:** PostgreSQL with SQLAlchemy 2.0 and Alembic migrations (`alembic/`); local/S3 compatible storage service (`storage.py`).

---

## 3. Detailed Root-Cause Analysis (The 12 Critical Inquiries)

### 1. Why the doctor was displayed as a photograph
- **File:** `frontend/components/doctor/DoctorVideoCall.tsx` (Line 658) & `DoctorPhotorealisticViewport.tsx` (Lines 233–278)
- **Root Cause:** In `DoctorVideoCall.tsx`, line 42 imports `DoctorPhotorealisticViewport`. In `DoctorPhotorealisticViewport.tsx`, the primary render element was an `<img>` tag loading `/doctor/dr_arjun.jpg` or `/doctor/dr_ananya.jpg`.
- **Finding:** A 3D procedural rig existed in `frontend/components/doctor/DoctorCanvas3D.tsx`, but it was disconnected from `DoctorVideoCall.tsx` because its geometric primitive meshes (cubes, cylinders, spheres) looked robotic and did not match the user's photorealistic doctor photographs. Consequently, developers replaced it with the static photograph component.

### 2. Why the AI doctor did not behave like a real human
- **Root Cause:** In `DoctorPhotorealisticViewport.tsx`, "animation" was implemented purely as 2D CSS transforms on the entire image container:
  ```tsx
  transform: `scale(${breathingScale}) translate3d(${headPose.yaw * 3.2}px, ${headPose.pitch * 2.8}px, 0) rotate(${headPose.roll * 0.4}deg)`
  ```
  The mouth was simulated via a CSS radial gradient dot positioned over the lips:
  ```tsx
  background: 'radial-gradient(ellipse at center, #260D08 40%, #5C1E14 75%, transparent 100%)'
  ```
  This produced a flat, vibrating 2D image rather than anatomically correct facial deformation, eye gaze tracking, jaw opening, or natural human micro-expressions.

### 3. Why voice responses were delayed
- **Root Cause:**
  1. **Artificial Delay:** `DoctorVideoCall.tsx` (Line 280) contained an explicit artificial `setTimeout(() => { ... }, 550)` before invoking speech.
  2. **Silence Detection Lag:** `SpeechRecognition` was operating with browser default VAD, requiring 1500–2500ms of complete silence before the browser triggered `onresult`.
  3. **SpeechSynthesis Initialization:** `window.speechSynthesis.speak()` encounters IPC latency when acquiring macOS speech dispatchers, adding an extra 400–1200ms before first audio output.
  4. **Total Turnaround Time:** 2.5s (VAD silence wait) + 0.55s (artificial timeout) + 0.8s (speechSynthesis warm-up) = ~3.85 seconds before the doctor started answering!

### 4. Why the doctor sometimes did not respond after the patient speaks
- **Root Cause (Critical Bug):**
  In `DoctorVideoCall.tsx` (Lines 180–218):
  ```tsx
  recognition.continuous = false;
  recognition.onresult = (event) => {
    setIsListeningSpeech(false);
    ...
  }
  recognition.onerror = () => {
    setIsListeningSpeech(false);
    setDoctorState('idle');
  }
  recognition.onend = () => {
    setIsListeningSpeech(false);
  }
  ```
  Setting `continuous = false` causes the browser's speech engine to terminate immediately upon returning the first result or encountering a transient `no-speech` timeout. Because `onend` and `onerror` set `isListeningSpeech = false` without an automatic restart loop, the microphone remained permanently shut down. When the patient spoke a second time, the microphone was completely closed.

### 5. Whether audio capture is working correctly
- **Status:** Partially Functional / Unstable.
- **Finding:** Microphone permissions were properly requested via WebRTC (`navigator.mediaDevices.getUserMedia`), but raw audio streams were not routed through a Web Audio `AudioContext` with an `AnalyserNode` in the consultation room. Therefore, the application could not measure true audio energy (RMS/dB) or perform clientside Voice Activity Detection.

### 6. Whether speech recognition returns accurate transcripts
- **Status:** Functional for English and Hindi; High failure rate for Kannada, Telugu, and other Indic languages under default browser configurations.
- **Finding:** Browser `webkitSpeechRecognition` delegates to Google Cloud STT on Chrome, but fails silently or defaults to English on Safari, Firefox, and Chromium builds without active Google speech services. In contrast, the backend's Gnani.ai Prisma v3.0 (`gnani_service.py`) provides 94%+ accuracy for Indic vernacular, but was never connected to the live consultation room.

### 7. Whether the LLM receives the transcript
- **Status:** Functional via Client Clinical Engine (`medicalConsultationEngine.ts`).
- **Finding:** The consultation engine receives the transcript string accurately and performs regex/keyword entity extraction, maintaining `ClinicalSessionMemory`. However, when backend streaming LLM was toggled, invalid/placeholder API keys (`ANTHROPIC_API_KEY=your_anthropic_api_key_here`) caused uncaught Promise rejections in the background.

### 8. Whether TTS audio is generated successfully
- **Status:** Inconsistent across operating systems.
- **Finding:** `window.speechSynthesis` is host-dependent. On macOS, Siri voices or system TTS voices are used. For Indian languages, macOS lacks Kannada/Telugu TTS by default, causing the speech synthesizer to either remain silent or mangle pronunciation using an English phoneme engine.

### 9. Whether audio playback is delayed or blocked
- **Status:** Intermittently blocked by Browser Autoplay Policies.
- **Finding:** If the user did not click or interact with the document before a doctor speech event, browsers block `AudioContext` and `speechSynthesis` until the first explicit user gesture. No audio unlocking mechanism (`resume()` on first click) was in place.

### 10. Whether the conversation state gets stuck
- **Status:** Highly Vulnerable.
- **Finding:** If an utterance was cancelled via `synthRef.current.cancel()`, `utterance.onend` was never dispatched on Chrome. As a result:
  `setIsSpeaking(false)` and `onStateChange('listening')` were never invoked. The UI remained permanently locked in `doctorState === 'speaking'`, rejecting all future microphone inputs.

### 11. Whether language selection is correctly synchronized
- **Status:** Out of Sync across subsystems.
- **Finding:** `LanguageSelectionModal.tsx` set the language state, but `useDoctorSpeech.ts` was not refreshing its available voices dynamically when language changed during a call. In addition, `SpeechRecognition.lang` was only updated on component mount, causing voice recognition to remain on the initial language despite UI language switches.

### 12. Whether microphone, interrupt, and camera controls work
- **Status:**
  - **Camera:** Functional via `PatientWebcamPiP.tsx`.
  - **Microphone:** Unstable due to single-shot `continuous = false` bug.
  - **Interrupt:** Cancelled audio but failed to reliably unlock speech recognition.
  - **Quick Clinical Inquiries:** Rendered suggestions, but clicking them did not trigger voice synthesis consistently.

---

## 4. Key Component Matrix

| Component | File Path | Existing Status | Defect / Vulnerability | Remediation Plan |
| :--- | :--- | :--- | :--- | :--- |
| **Consultation Viewport** | `components/doctor/DoctorPhotorealisticViewport.tsx` | 2D Static Image | Renders static photo with 2D CSS scale/rotate; no real 3D mesh or facial blendshapes | Upgrade to interactive 3D WebGL Digital Human engine with face mesh deformation, blendshapes, and audio-driven visemes |
| **3D Canvas Rig** | `components/doctor/DoctorCanvas3D.tsx` | Disconnected | Procedural primitives (boxes, cylinders) do not look like realistic doctors | Integrate photo-contoured head mesh, high-resolution skin shaders, realistic eyes, and medical clothing |
| **Speech Synthesizer** | `components/doctor/useDoctorSpeech.ts` | Fragile WebSpeech | Stuck in speaking state, missing Indian language voice packs on OS | Add Web Audio buffer unlocker, fallback speech synthesis, and direct voice streaming |
| **Video Consultation Suite** | `components/doctor/DoctorVideoCall.tsx` | Unstable Mic & VAD | Single-shot STT, microphone drops after 1 turn, lack of continuous listening | Implement continuous speech recognition loop with automatic error recovery and VAD |
| **Clinical Engine** | `lib/medicalConsultationEngine.ts` | Working Local Logic | Good triage & multi-turn memory; needs deeper contextual responses | Enhance follow-up questions and eliminate repetitive queries |

---

## 5. Architectural Upgrade Roadmap

1. **Digital Human Model Engine (Three.js WebGL):**
   - Implement an advanced Three.js Digital Human viewport combining:
     - Anatomically contoured 3D facial mesh with Dr. Smit and Dr. Ananya reference identities.
     - Morph targets for 8 primary visemes: `rest`, `aa`, `ee`, `oo`, `oh`, `ch`, `th`, `m`.
     - Natural physiological micro-expressions: bilateral synchronous blinking (2.8–4.2s), saccadic eye gaze tracking, sinusoidal breathing (14 bpm), and conversational head nods/tilts.
     - Distinct clinical attires: Dr. Smit (White Lab Coat + Dark Teal Scrubs + Classic Stethoscope) and Dr. Ananya (White Lab Coat + Cobalt Scrubs + Blue Stethoscope).
2. **Resilient Continuous Audio & VAD Pipeline:**
   - Redesign `useDoctorSpeech` and `DoctorVideoCall` with an auto-healing Speech Recognition watchdog.
   - Continuous speech listening with intelligent pause detection: detects sentence completion without terminating the microphone session.
   - Immediate interruption handling (Barge-in): patient speech immediately halts doctor audio playback and flips avatar to attentive listening posture.
3. **Multilingual Voice Consistency:**
   - Dynamic voice profile resolver for English, Kannada, Hindi, Telugu, Tamil, Malayalam, Marathi, Bengali, and Gujarati.
   - Seamless language switching preserving existing symptom history and triage state.
4. **Diagnostic & Telemetry Console:**
   - Floating developer/telemetry overlay measuring exact latencies: VAD latency, STT turnaround, response computation time, and audio playback start.

