# Talking portrait (no GPU, no API)

The two doctors (Dr. Smit, Dr. Ananya) blink and speak in real time on any laptop CPU.

## How it works
1. **Landmarks, baked once.** `frontend/lib/doctorFaceData.ts` holds 68 face landmarks per photo,
   detected offline with face-api.js (MIT). Nothing is detected at runtime.
   The inner-lip points were refined against each photo's own lip-contact line, and the mouth
   opens along the lips' own (tilted) axis.
2. **Mesh warp.** `frontend/lib/portraitWarp.ts` redraws small triangle grids around the eyes,
   brows and mouth on a 2D canvas: eyelids close onto the lower lid, the jaw and lower lip drop,
   the upper lip lifts, the mouth widens/narrows, and a mouth interior (cavity, teeth, tongue)
   fills the gap between the displaced inner-lip landmarks. The interior is a soft, shaded lens
   (dark cavity, upper teeth, tongue) blended into the lips; opening sizes are kept small, as in
   real speech.
3. **Driven by the real voice.** `frontend/lib/audioEnergy.ts` taps the doctor's playing audio
   with the Web Audio API (loudness -> mouth opening, high/low band balance -> wide/round).
   Mute uses a gain node so the mouth still follows the audio. If speech comes from the
   browser's own speech synthesis (no audio element) the existing level estimate is used.
4. **Natural idle behaviour.** Blinks every 2.5-6 s (sometimes a double blink), breathing,
   listening micro-nods, brow lift on emphasis.

## Limits (be aware)
- It is a 2D puppet of a single photograph: no head turns, no real teeth, no exact phonemes.
  It is not photoreal video lip-sync (MuseTalk and similar need a GPU).
- If the generated MuseTalk video arrives while its audio chunk is still playing, the existing
  logic still prefers it; on CPU-only machines it never does, so this portrait is what you see.
- If you change `public/doctor/*.jpg`, re-bake the landmarks.
- The portraits look like stock photographs of real people; confirm you have the right to
  animate them as an AI doctor, or replace them with licensed or synthetic faces.

## Note on the MuseTalk sample videos
The two sample MuseTalk clips (greeting audio) were frame-aligned with the photos but the mouth
barely opens in them (lips almost closed), so they could not be used as a source of open-mouth
textures. The mouth here is generated procedurally instead.
