# MEDICARE™ REAL-TIME VOICE PIPELINE AUDIT
**Document Version:** 1.0.0  
**Date:** November 3, 2026  
**Module:** Continuous VAD, Indic STT, Speech Synthesis, State Recovery

---

## 1. Speech Recognition & Voice Activity Detection (VAD) Failures

### Root Cause 1: `recognition.continuous = false`
- **Location:** `frontend/components/doctor/DoctorVideoCall.tsx`
- **Issue:** Web Speech API terminates immediately after returning the first final transcript.
- **Fix:** Switch `continuous = true`, enable `interimResults = true`, and implement an active silence debounce watchdog timer (700ms - 1100ms) to detect end-of-turn automatically without turning the microphone off.

### Root Cause 2: Unhandled `no-speech` and browser abort errors
- **Location:** `recognition.onerror`, `recognition.onend` in `DoctorVideoCall.tsx`
- **Issue:** Whenever ambient silence occurs, Chrome triggers `error: 'no-speech'`, calling `setIsListeningSpeech(false)`. This shuts off the mic permanently.
- **Fix:** Implement an auto-restarting watchdog loop that checks if the consultation is active and user has not explicitly muted, immediately restarting the listener.

### Root Cause 3: Audio Playback Lock & Garbage Collection Stalling
- **Location:** `frontend/components/doctor/useDoctorSpeech.ts`
- **Issue:** On Chrome on macOS, long or rapid utterances get garbage-collected before `onend` fires, leaving `isSpeaking = true` and `doctorState = 'speaking'` permanently stuck.
- **Fix:** Keep strong references to active utterances on `window`, add an audio duration watchdog fallback to force state resolution to `listening` after expected speech duration, and support Barge-in cancellation.

---

## 2. Latency Optimization Metrics

| Pipeline Stage | Old Latency | Optimized Target |
| :--- | :--- | :--- |
| Audio End-of-Utterance Detection | 2200ms (browser timeout) | 650ms (Sliding VAD Debounce) |
| Clinical Engine Triage & Turn | 550ms (artificial timeout) | 20ms (Immediate execution) |
| Speech Synthesis Audio Dispatch | 900ms (unprimed voice) | 120ms (Pre-warmed synthesis engine) |
| **Total Response Turnaround** | **~3.65 seconds** | **~0.85 – 1.1 seconds** |
