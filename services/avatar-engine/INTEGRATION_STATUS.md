# Avatar model audit and current integration

**Updated:** 2026-11-04 17:54 IST

## Current result

The backend's MuseTalk path has generated and delivered one genuine Kannada speaking clip for Dr. Ananya. The clip uses the Kannada WAV produced by the active Gnani TTS voice (`Nayana`) for the same response. It was played by the existing consultation video element in the browser. This demonstrates a real model output for one video chunk; it does not complete the full consultation acceptance cycle.

Evidence:

- [`artifacts/dr_ananya_musetalk_speaking_clip.mp4`](../../artifacts/dr_ananya_musetalk_speaking_clip.mp4): H.264 1024×582 at 25 fps with AAC audio, both streams starting at 0 and lasting 3.520 seconds.
- [`artifacts/dr_arjun_musetalk_male_voice_demo.mp4`](../../artifacts/dr_arjun_musetalk_male_voice_demo.mp4): direct male Kannada Edge TTS → MuseTalk output using Dr. Smit's supplied reference identity; H.264 1528×1030 at 25 fps with AAC audio. Both tracks start at 0; video is 7.240 s and audio is 7.211 s. TTS plus first generated clip took 126.6 s on this Apple Silicon MPS host. This uses a test phrase, not an AI consultation answer, and was not browser-recorded.
- [`artifacts/dr_ananya_musetalk_frames.png`](../../artifacts/dr_ananya_musetalk_frames.png): sampled frames showing changing mouth shapes during the generated clip.
- [`artifacts/dr_ananya_browser_playback.json`](../../artifacts/dr_ananya_browser_playback.json): observed browser video element and backend `video_chunk` event.
- [`MEDICARE_FRONTEND_FINAL_REPORT.md`](../../MEDICARE_FRONTEND_FINAL_REPORT.md): implementation, measurements and acceptance gaps.

The measured first-chunk latency was about 321 seconds from the patient message reaching the backend to the generated video chunk becoming available. About 53 seconds were model startup and 267 seconds were inference. The run used Apple MPS on an Apple Silicon MacBook Air M5 with 16 GB unified memory. Per-process GPU memory use was not measured. This latency is not suitable for a live conversation.

## Live conversation follow-up (2026-11-04)

- The browser's `Error` state was caused by the local Ollama daemon being stopped. The backend was configured for `qwen2.5:3b` at `localhost:11434`, and the daemon was not reachable. Starting Ollama restored the configured model and a direct backend LLM request succeeded. The backend health endpoint now checks the Ollama daemon and configured model instead of reporting readiness from configuration alone.
- Exact English, Kannada and Hindi greetings now receive a short localized text response without a separate LLM call or Kannada retrieval translation. Other questions continue through the configured LLM and medical retrieval path.
- The response queue no longer blocks LLM text completion behind slow video rendering. The microphone is paused only when the first generated video chunk is ready to play.
- This does not make MuseTalk real-time on the local Apple M5. Its previously measured first-clips remain minutes long. No new full consultation video cycle was benchmarked in this follow-up.

## Model audit

| Model | Local state and capability | Licence/runtime notes | Decision |
|---|---|---|---|
| MuseTalk | Inference was executed successfully with local checkpoints. Audio-conditioned mouth inpainting generated the speaking clip above. | Upstream code is MIT; separately review dependency and asset terms. The available worker was adapted for Apple MPS. | Selected for this first audio-driven speaking path. Current MPS latency is high. |
| EchoMimic V3 | Source checkout is present; required pretrained checkpoints are not present. It is an audio-driven diffusion video generator, not currently wired to this working consultation path. | Apache-2.0 source; model/runtime is GPU intensive and upstream setup is CUDA-oriented. | Not executed or selected. |
| EchoMimic V1 | Source checkout is present; required pretrained checkpoints are not present. It generates audio-conditioned portrait video. | Apache-2.0 source; upstream requirements target CUDA-era GPU environments. Review model/data terms before product deployment. | Not executed or selected. |
| LivePortrait | Source checkout is present; pretrained checkpoints are absent. It transfers motion from a driving video and does not itself create audio-synchronized mouth motion. | MIT code; upstream notes InsightFace model terms separately. It documents Apple Silicon support. | Not used; listening view currently uses the reference portrait with subtle whole-frame movement. |
| AniPortrait | Source checkout is present; required trained/base weights are absent. It can render audio-driven portrait motion but is a clip-generation pipeline. | Apache-2.0 code; checkpoints and base models have separate terms; published setup is CUDA-centric. | Not executed or selected. |
| LiveTalking | Not cloned into this repository and no LiveTalking-specific model assets are installed. It is a real-time WebRTC session/runtime that can host models such as MuseTalk; it is not another portrait model. | Apache-2.0 source; model weights and bundled dependencies have their own terms. Upstream setup is CUDA-oriented; no Apple M5 benchmark is available here. | Evaluated from upstream docs. Do not add it to the current WebSocket path until a CUDA deployment target is chosen; it overlaps session and interruption handling already in the MediCare backend. |

The MuseTalk weights used for this run are installed under `services/avatar-engine/models/MuseTalk/models`. The other four checkouts have source code only, without the required pretrained model checkpoints. A source checkout or adapter is not evidence of executable inference.

## Integration notes

- For Dr. Ananya and Dr. Smit, the consultation WebSocket sends the generated response audio through the MuseTalk worker and emits generated video chunks. The frontend plays the returned MP4, which carries its matching audio. Ananya's Kannada chunk was previously run end to end. Smit's Kannada TTS-to-MuseTalk path was also run directly using his reference photo. His WebSocket received and persisted a test question, but the configured LLM provider could not connect, so no AI answer was generated for this check.
- The frontend no longer applies CSS mouth animation or reports fabricated FPS, 3D readiness, model readiness, or voice-preview results.
- During listening, the original portrait remains visible with small whole-frame pose/breathing movement. There is no model-generated blink or eye motion yet.
- Backend TTS voice selection uses doctor gender: Dr. Ananya receives female voices and Dr. Smit receives male voices for the configured Kannada/English paths. The frontend now sends both doctors' consultation turns to that backend model path. Ananya's AI response clip was previously browser-played. Smit's separate model demo is verified as a file, but his AI-response browser playback remains unverified.
- The complete response queue/turn, microphone capture, English browser animation, interruption, and return-to-listening cycle remain unverified.

## Upstream references

- [MuseTalk repository, setup, and licence notes](https://github.com/TMElyralab/MuseTalk)
- [EchoMimic V3 repository](https://github.com/antgroup/echomimic_v3)
- [EchoMimic V1 repository and tested GPU notes](https://github.com/antgroup/echomimic)
- [LivePortrait repository and Apple Silicon notes](https://github.com/KlingAIResearch/LivePortrait)
- [AniPortrait repository and checkpoint list](https://github.com/Zejun-Yang/AniPortrait)
- [LiveTalking repository, WebRTC and interruption support](https://github.com/lipku/LiveTalking)
