# MediCare voice conversation and frontend implementation report

**Date:** 2026-11-03 (Asia/Calcutta)
**Scope:** Make the doctor consultation feel conversational and improve the doctor-selection and consultation experience. Existing app, API, authentication, session, report, triage, and summary structure remain in place.

## Voice conversation behavior

- After the patient selects a language and starts a consultation, supported browsers start speech recognition from that user action.
- Interim speech is shown in the conversation panel. Final recognition fragments are combined and sent after an 850 ms pause so a sentence is less likely to be split into several messages.
- For both Dr. Ananya and Dr. Arjun, recognized or typed text goes through the existing consultation WebSocket. The backend response, doctor-specific TTS, and MuseTalk video path are responsible for the spoken answer. Kannada and English select a female voice for Ananya and a male voice for Arjun.
- Speech input starts after the backend session connects, pauses during doctor audio/video so the microphone does not transcribe the doctor's own voice, and resumes after the generated clip ends. The patient can interrupt with the call control.
- Microphone permission, missing-device, and unsupported-browser cases show a message and retain the typing path. Microphone can be turned off at any time.
- The doctor speaker mute control affects synchronized video audio and local speech used by non-consultation tools.

This is natural turn-taking: the app listens to the patient, waits for a short pause, sends the utterance, plays the response, and listens again. It does not mix the patient's voice and the doctor's audio at the same time.

## Frontend changes

- Added `useConsultationSpeechRecognition.ts` to own browser speech recognition, selected language, partial transcript, phrase coalescing, pause/resume, restart recovery, and user-visible errors.
- Reworked `DoctorVideoCall.tsx` into a doctor-first consultation surface with a large video area, clear state and language controls, accessible call controls, and a readable conversation panel.
- Restyled `LanguageSelectionModal.tsx` with keyboard-operable language buttons, selected-state semantics, and concise voice-input guidance.
- Rebuilt `DoctorShowcaseSection.tsx` as restrained profile cards using the existing Dr. Arjun and Dr. Ananya reference portraits. Removed the 3D tilt/parallax and unsupported VAD/instant-recovery claims.
- Updated the landing page loading labels and metadata to remove unsupported 3D, FPS, voice-cloning, and model claims. Updated the guest-session notice.
- Kept existing medical tools and application routing. No design library, paid service, or new package was added. Design research and selection notes are in [MEDICARE_DESIGN_RESEARCH.md](MEDICARE_DESIGN_RESEARCH.md).
- Replaced the report panel's hard-coded lab results with the existing report-review API. It accepts pasted text or a local TXT/CSV file; PDF/image OCR is explicitly unavailable. Returned output contains reference guidance only and does not claim to extract or verify numeric values.
- Replaced the specialist modal's local directory and success fallback with the existing specialist-directory and appointment-request APIs. Failures now remain visible, and the UI says clinic availability still needs confirmation.
- Labeled the landing page's 3D report visualization as a sample-only preview and removed its unsupported OCR-certification claim.

## Verification

- `npm run typecheck`: passed after routing both doctors to the backend.
- ESLint on changed frontend files: passed after correcting the portrait animation clock initialization.
- `npx next build --webpack`: passed and generated the static home route.
- `git diff --check`: passed.
- `http://localhost:3000/`: returned HTTP 200 after the build; rendered HTML included the landing-page heading and doctor selection text.
- With the backend pointed to the available local Postgres instance, Arjun's avatar and session were created, and the Kannada patient question reached the WebSocket. The configured LLM provider then failed to connect, so this turn had no AI response.
- Independently verified the Arjun male Kannada TTS (`edge-tts`, no fallback) and MuseTalk output against his reference photo. The sample clip is [dr_arjun_musetalk_male_voice_demo.mp4](artifacts/dr_arjun_musetalk_male_voice_demo.mp4), 25 fps, 1528×1030, with synchronized AAC audio. This is a model test phrase, not an AI consultation answer or browser capture.
- Existing backend API checks: specialist directory returned three Chikkamagaluru entries; report review recognized the supplied Hemoglobin, glucose, and TSH terms without inventing numeric result values.
- Latest frontend checks after replacing the report and appointment fallbacks: TypeScript passed, ESLint passed on changed UI files, and the Webpack production build passed. The running app returned HTTP 200.
- The in-app browser was unavailable in this session (`iab` could not be connected), so I could not visually inspect desktop/tablet/mobile screenshots or grant a microphone permission prompt. No real microphone speech test was claimed.

The default `npm run build` attempted Turbopack and failed because this machine lacks the native Darwin/arm64 Next.js binding. The recommended Webpack build completed successfully.

## Remaining limitations

- Browser speech recognition requires a compatible browser and microphone permission. The actual microphone path still needs a real browser speech test on the user's device.
- Dr. Arjun is wired to the same backend response and MuseTalk video path, with male Kannada/English TTS selection. His standalone TTS-to-MuseTalk output succeeded, but the LLM provider connection failure prevented a real AI answer; browser playback remains unverified.
- Dr. Ananya's generated video output has previously been verified for one genuine Kannada chunk, but her full microphone-to-response-to-listening cycle remains unverified. Current MPS generation latency is about 321 seconds for the first short chunk, as recorded in [MEDICARE_FRONTEND_FINAL_REPORT.md](MEDICARE_FRONTEND_FINAL_REPORT.md).
- No full browser screen recording or responsive visual proof is included because the in-app browser could not be connected.
