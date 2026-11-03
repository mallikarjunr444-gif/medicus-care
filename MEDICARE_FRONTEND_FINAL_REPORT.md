# MediCare frontend and speaking-cycle report

**Date:** 2026-11-03
**Status:** Partial implementation; full acceptance criteria are not met.

## What changed

- Simplified the consultation doctor area to use the existing photorealistic reference images and the backend's actual generated video chunks. Removed the 3D avatar rendering path and CSS mouth movement.
- Connected Dr. Ananya's consultation response path to the existing session WebSocket. Response video chunks are queued and played in order; the state follows backend connection, generation, playback, error, and interruption events. Video playback errors are surfaced instead of showing a speaking state over a still image.
- Added a user-gesture playback prompt when a browser blocks video autoplay. Added WebSocket reconnect backoff and session cleanup.
- Kept the patient microphone, speech recognition, camera preview toggle, speaker mute, interrupt, end-call, language selection, transcript, consultation summary, report upload, and specialist booking paths. The microphone starts muted/off until enabled. Doctor selection occurs before the call.
- Removed unsupported voice preview and voice-selection UI, fake model-ready and FPS labels, simulated backend connection indicators, and unbacked introductory doctor speech. Removed 3D call labels and reduced redundant home-page/promotional UI while retaining existing medical flows.
- Routed backend TTS voice selection by doctor gender for the supported first-cycle languages: Dr. Ananya uses female voice output; Dr. Arjun uses male voice output. Backend language handling now preserves Kannada. Repaired Gnani WAV length headers so the generated audio can be decoded for animation. Improved the MuseTalk worker's readiness, MPS precision/batch behavior, diagnostics, interruption cleanup, and audio/video muxing.

## Model and identity audit

MuseTalk is the only model in this checkout executed successfully for speaking output. Its local checkpoints are installed under `services/avatar-engine/models/MuseTalk/models`. It generated a clip from the actual Kannada Gnani response WAV and Dr. Ananya reference image. The source code is MIT-licensed; review dependency and model asset terms separately before distribution.

LivePortrait, EchoMimic V3, EchoMimic V1, and AniPortrait source repositories are present, but their required pretrained checkpoints are absent. LivePortrait transfers driving motion and is not itself audio-to-mouth synchronization. The EchoMimic and AniPortrait inference paths were not executed. See [the model audit](services/avatar-engine/INTEGRATION_STATUS.md).

The verified Ananya response video uses her existing reference identity. Dr. Arjun's attached reference photo is installed at the existing doctor image path, and his consultation branch is wired to the same backend response, male TTS, and MuseTalk path. A direct male Kannada TTS-to-MuseTalk sample was generated from his supplied photo at 25 fps; it is linked below. His WebSocket test accepted and saved the Kannada question, but the configured LLM provider could not connect, so no AI answer was available for that turn.

## Genuine browser and model evidence

- The frontend at `http://localhost:3000` and backend at `http://localhost:8000` respond. The local backend was started against the available local Postgres instance; Redis is unavailable but non-fatal. Session creation and WebSocket delivery succeeded. The LLM provider connection failed before TTS for the consultation turn.
- A Kannada question was typed into the consultation UI and reached the backend. The AI generated a Kannada answer; Gnani produced actual Kannada audio with its female `Nayana` voice; MuseTalk processed that audio; the backend sent a `video_chunk` event; and the existing browser doctor video element loaded and played that generated clip.
- Evidence files: [speaking video](artifacts/dr_ananya_musetalk_speaking_clip.mp4), [sampled frames](artifacts/dr_ananya_musetalk_frames.png), [browser playback observation](artifacts/dr_ananya_browser_playback.json).
- Dr. Arjun model sample: [male Kannada TTS → MuseTalk clip](artifacts/dr_arjun_musetalk_male_voice_demo.mp4) and [sampled generated frames](artifacts/dr_arjun_musetalk_frames.png). It is 1528×1030 at 25 fps, with AAC audio starting at the same timestamp as video (7.211 s audio, 7.240 s video; 29 ms track-end difference). It took 126.6 s including TTS and animation on Apple MPS. GPU utilization and memory were not measured. This is a direct test phrase, not an LLM response or browser recording.
- `ffprobe` measured H.264 1024×582 video at 25 fps with AAC, 24 kHz mono audio. Both tracks start at 0.000 seconds and last 3.520 seconds. Sampled frames show changing mouth shapes. This verifies generated video and muxed track timing; no phoneme-level sync-error metric was captured.
- First video chunk became available about 321 seconds after the patient message reached the backend: about 53 seconds for model startup and 267 seconds for generation. The machine was an Apple Silicon MacBook Air M5 with 16 GB unified memory and Apple MPS. Worker GPU memory usage was not measured. This latency is too high for a responsive live consultation.
- Actual Kannada and English TTS audio was separately synthesized for female Ananya and male Arjun voices. This did not verify English browser animation.
- Frontend TypeScript checking, Python compilation for changed backend modules, and `git diff --check` are the code checks. A 390 px mobile overflow check previously measured matching viewport and document widths.

## Acceptance still outstanding

- Microphone-captured Kannada and English question flows. The verified Kannada question was typed.
- Full response playback and return to listening after all chunks finish, followed by a second patient turn.
- English browser animation and audio/video synchronization verification beyond track start/duration.
- Interruption during generated speech, generation cancellation, reconnection recovery, and end-call media cleanup in the browser.
- Dr. Arjun's LLM-generated response and browser playback. His WebSocket received the question, but the LLM provider could not connect; only the independent male TTS-to-model sample completed.
- Model-generated listening animation with natural blinking/eye motion. Current listening view uses the preserved reference portrait with subtle whole-frame movement; it does not provide model-generated eye or blink motion.
- A saved screen recording showing a real browser listening-to-speaking transition. The saved MP4 is the genuine model output; the browser playback observation is recorded as JSON. No screen recording is represented as evidence.

## Conclusion

The first real Kannada Ananya speaking **chunk** goes from backend response through actual TTS and MuseTalk to the existing browser video area. Arjun's male Kannada TTS-to-MuseTalk model output is also now verified as a generated file, and both doctors are wired to the model response path. The complete Arjun consultation turn could not be verified because the LLM provider failed to connect; neither microphone capture nor Arjun browser playback was tested. The measured latency, listening animation gap, and unverified full-turn behaviors mean the acceptance test is still incomplete.
