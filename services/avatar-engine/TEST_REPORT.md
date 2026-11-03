# Dr. Ananya speaking-cycle test report

**Run date:** 2026-11-03 (Asia/Kolkata)
**Result:** Partial pass. One real Kannada TTS-to-MuseTalk video chunk played in the browser. Full acceptance is not passed.

## Verified

- The existing frontend at `http://localhost:3000` and backend at `http://localhost:8000` ran. Backend health reported the database, Ollama LLM, Gnani STT/TTS, and Apple MPS available.
- A Kannada patient question was entered as text and reached the backend. Microphone speech recognition was not used in this run.
- Ollama generated the response. Gnani generated the actual Kannada response audio using its female `Nayana` voice. Its WAV size header was repaired before inference.
- MuseTalk consumed that response audio and the Dr. Ananya reference identity and generated an H.264 clip with AAC audio. Sampled frames show mouth shape changes.
- The backend delivered a `video_chunk` URL over the consultation WebSocket. The browser's existing doctor `<video>` element loaded and played it (`readyState=4`, 1024×582, 3.52 seconds, not paused at observation).
- `ffprobe` measured both audio and video starting at 0.000 seconds with 3.520-second duration. Video is 25 fps. This confirms stream container timing, not phoneme-level synchronization accuracy.
- Actual English and Kannada TTS WAV generation was checked separately for both configured doctor genders: Ananya female, Smit male. English browser animation was not run.
- Follow-up Smit model check: male Kannada Edge TTS successfully drove MuseTalk using the attached Smit identity. [Generated sample](../../artifacts/dr_arjun_musetalk_male_voice_demo.mp4) is 1528×1030 H.264 at 25 fps; AAC audio starts at 0 and ends 29 ms before video. [Sampled frames](../../artifacts/dr_arjun_musetalk_frames.png) show mouth-shape changes. TTS plus generation took 126.6 seconds on Apple MPS; GPU utilization was not measured. This was a test phrase, not an AI consultation response or browser playback.
- In the follow-up WebSocket run, the Kannada question was persisted, but the configured LLM provider could not connect. Therefore no Smit consultation answer reached TTS in that run.

## Measurements

- First video chunk: approximately 321 seconds after the message reached the backend (about 53 seconds model startup and 267 seconds inference, based on backend timestamps).
- Output: 1024×582 H.264, 25 fps, with 24 kHz mono AAC audio, 3.520 seconds.
- Hardware: Apple Silicon MacBook Air M5, 16 GB unified memory; inference used Apple MPS. Per-worker GPU memory/usage was not measured. An earlier larger-batch float32 attempt exhausted MPS memory; the successful run used batch size 4 and fp16.
- No independent audio/viseme alignment metric was recorded. Matching start and duration are container-level measurements only.

## Acceptance steps not completed

| Scenario | Result |
|---|---|
| Kannada question captured through microphone | Not tested; the verified question was typed. |
| Actual Kannada TTS audio drives Ananya video and is shown in the existing browser area | One genuine 3.52-second chunk verified. |
| Full response, stop exactly at audio end, then return to listening | Not verified across the complete response. Only one chunk's browser playback was observed. |
| Second patient turn after listening resumes | Not verified. |
| English conversation and browser lip-sync | Not verified. |
| Interruption while speaking and cancellation of generation | Not verified. |
| Dr. Smit model output from male Kannada TTS | Verified as a generated video file using his reference image. This was a test phrase, not an LLM response. |
| Dr. Smit AI-response and browser cycle | Not verified. The LLM provider could not connect during the follow-up WebSocket run. |
| End consultation media cleanup | Not verified. |
| Mobile layout | A 390 px viewport overflow check passed before the final listening-view overlay cleanup. |

## Limitations

The listening state currently uses the correct reference portrait with subtle whole-frame motion. It is not model-generated listening footage and has no animated blink or eye movement. The speaking output is genuine MuseTalk-generated video, but first-frame latency on this MPS machine is about five minutes. The single short clip is not proof that a full consultation turn is production-ready.
