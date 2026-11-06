# Local Hindi/Kannada TTS with Indic-Speak

The main backend sends Hindi (`hi`) and Kannada (`kn`) synthesis to a local
Indic-Speak worker. English continues through the existing `TTS_PROVIDER` path.
The same returned 24 kHz mono WAV is streamed to the browser and passed to the
existing avatar/lip-sync worker.

## Before installing

- The model repository is gated. Review and accept its terms on the
  [Indic-Speak Hugging Face page](https://huggingface.co/bodhan-ai/indic-speak)
  and log in locally with `hf auth login`. Do not paste a Hugging Face token
  into chat or commit it to `.env`.
- The first synthesis downloads roughly 7.3 GB of model files into the local
  Hugging Face cache. The model's BF16 weights alone are about 6.6 GB.
- Indic-Speak uses the custom Indic Open Model License. Its terms require
  Bodhan AI's written approval before hosting an inference API for other
  people/companies, except for the stated nonprofit, government, academic, or
  open-release exceptions. This setup binds to `127.0.0.1` for local testing;
  obtain the required rights before offering it to patients or other users.
- The current development Mac reports Apple MPS and 16 GB unified memory. The
  model's official card does not specify minimum RAM/VRAM or guarantee MPS
  support. Keep other large models unloaded during the first test and measure
  memory and latency; do not assume real-time performance.

## Install and run the worker

Use Python 3.11 and a separate environment so the worker's Transformers 5
requirements do not replace the backend's MuseTalk-compatible Torch 2.2 stack:

```bash
cd backend
python3.11 -m venv venv-indic-speak
source venv-indic-speak/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-indic-speak.txt
hf auth login
uvicorn indic_speak_service.main:app --host 127.0.0.1 --port 8001
```

Accept the model terms before logging in. `hf auth login` stores credentials in
the local Hugging Face credential store; the worker reads them through the
standard Hugging Face client and does not need a token in application code.
The worker downloads and loads the model once at startup, before accepting
requests. The backend defaults to `INDIC_SPEAK_URL=http://127.0.0.1:8001`;
override this only when the worker is reachable at a different private address.
The model ID and Hugging Face revision are pinned in the worker for repeatable
local runs; change them explicitly with `INDIC_SPEAK_MODEL_ID` and
`INDIC_SPEAK_REVISION` only after validating a new release.

Restart the ordinary backend after changing code/configuration. Its English
voice selection is unchanged. If the Indic-Speak worker is stopped or the
gated model cannot be loaded, Hindi/Kannada return a clear TTS error rather
than being sent to Gnani, Edge TTS, gTTS, or an English voice.

## Voice routing and smoke sentences

| Language | Dr. Smit (male) | Dr. Ananya (female) |
|---|---|---|
| Hindi (`hi`) | Amit | Kavya |
| Kannada (`kn`) | Adarsh | Deepika |

The model card documents float32 waveform output at 24 kHz. The worker writes
PCM16 mono WAV and rejects silent, empty, non-finite, or invalid audio before
returning it to the backend.

Use these exact text inputs for a manual listen-through after the worker is
running:

```text
Hindi:   नमस्ते, मैं आपका डॉक्टर हूँ। आज आपको क्या परेशानी हो रही है?
Kannada: ನಮಸ್ಕಾರ, ನಾನು ನಿಮ್ಮ ವೈದ್ಯರು. ಇಂದು ನಿಮಗೆ ಏನು ತೊಂದರೆ ಆಗುತ್ತಿದೆ?
English: Hello, I am your doctor. How are you feeling today?
```

With the worker running, generate and inspect the Hindi and Kannada WAV files:

```bash
cd backend
venv-indic-speak/bin/python smoke_test_indic_speak.py
afplay "$(python3 -c 'import tempfile; print(tempfile.gettempdir())')/medicus-care-indic-speak/hindi.wav"
afplay "$(python3 -c 'import tempfile; print(tempfile.gettempdir())')/medicus-care-indic-speak/kannada.wav"
```

Confirm the Hindi/Kannada audio is intelligible and complete, then confirm the
same generated WAV drives the unchanged avatar lip-sync. File validity and a
successful HTTP response alone do not prove pronunciation quality. English is
an existing provider path and should be checked separately without changing
its route.
