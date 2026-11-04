# Frontend component and browser-animation decisions

## Existing stack

The app remains on Next.js App Router 16, React 18, Tailwind CSS 3, TypeScript, and its existing client-side view/navigation state. Existing dependencies already cover the immediate UI needs: `lucide-react` (icons), GSAP (animation), Three.js (WebGL rendering), TanStack Query (server state), and `clsx`/`tailwind-merge` (class composition). No UI or animation dependency was added for this refresh.

The new `clinical-primitives.tsx` gives the screens reusable, locally owned buttons, cards, and badges with a consistent healthcare palette. This follows the editable-source pattern of shadcn/ui; there is no need to install shadcn as a runtime library or copy a full template. Existing photo assets are retained: `/doctor/dr_arjun.jpg` for Dr. Smit and `/doctor/dr_ananya.jpg` for Dr. Ananya.

## Requested component resources: license and selection notes

License status is based on the projects' public repositories or license pages. Component code, models, fonts, and third-party assets may carry separate terms; check the exact item before copying it into a commercial product.

| Resource | Public/free terms | Decision for this frontend |
|---|---|---|
| [shadcn/ui](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) | MIT; source components are copied and owned by the app | Use as an implementation pattern; the app already has a Tailwind/React stack, so use small local primitives rather than add a package or replace the product shell. |
| [Magic UI](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md) | Public components are MIT; separately sold Pro blocks/templates exist | No new effect dependency needed; use only an individual MIT component if a concrete need arises. |
| [Aceternity UI](https://ui.aceternity.com/licence) | Site license has use restrictions; paid and third-party items vary | Not treated as a blanket open-source source. Verify each component's terms before adopting it. |
| [ReactBits](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) | MIT plus Commons Clause for the public collection; paid Pro items are separate | Not used. Prefer existing Tailwind/GSAP motion for lower CPU and dependency cost. |
| [21st.dev](https://21st.dev) | Multi-author registry; item licenses vary and the service has plan limits | Use for discovery only; audit exact source, license, and transitive dependencies per component. |
| [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | ISC (with a subset of icons attributed to Feather under MIT) | Already used throughout; continue a consistent outline icon language. |
| [Motion](https://github.com/motiondivision/motion) | Core library MIT; Motion+ is paid | Not installed. GSAP and CSS transitions already cover the interaction needs. |
| [Animate UI](https://github.com/imskyleen/animate-ui/blob/main/LICENSE.md) | MIT plus Commons Clause; paid items are separate | Not used; it adds overlap with existing animation code. |
| [Tremor](https://github.com/tremorlabs/tremor) | Apache-2.0 | No analytics dashboard change requires it yet. |
| [Recharts](https://github.com/recharts/recharts/blob/main/LICENSE) | MIT | Not added: no new chart behavior is part of this UI refresh. |
| [TanStack Table](https://github.com/TanStack/table/blob/main/LICENSE) | MIT | Not added: current history uses a compact searchable conversation list, not a large data grid. |
| [DayPicker](https://github.com/gpbl/react-day-picker/blob/main/LICENSE) | MIT | Not added: the existing appointment request uses a native date input and directory service; a calendar library is unnecessary. |

## Browser face technology investigation

| Technology | What it provides | Relevance and limits for a talking doctor |
|---|---|---|
| [MediaPipe Face Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js) | 478 landmarks, 52 expression blendshapes, transformation matrices from images/video; Apache-2.0 runtime | Useful for tracking a visible face in a webcam/video. It is not an audio-to-viseme model. `detectForVideo()` is synchronous and can block the UI thread; move it into a worker and benchmark. It cannot make an exact doctor photo talk by itself. |
| [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) | Executes supplied ONNX models with WASM CPU, plus browser GPU backends where supported; MIT | A runtime, not an animation model. CPU requires small/quantized models for reasonable latency. WASM threading needs cross-origin isolation; worker execution protects UI responsiveness but is not extra CPU speed. Verify weights/licensing separately. |
| [TensorFlow.js](https://www.tensorflow.org/js/guide/platform_environment) | JavaScript/WASM/WebGL/WebGPU inference backends; Apache-2.0 | Face-landmarks-detection offers tracking but, like MediaPipe, does not infer mouth shapes from speech. Running both adds size and compute without solving audio lip sync. |
| [Three.js](https://threejs.org/) | WebGL rendering and morph-target control; MIT | Already installed. `Mesh.morphTargetInfluences` can animate a 3D character only if its licensed asset has correctly authored viseme/blendshape targets. Three.js does not create face motion or speech timing. |

### Genuine audio-driven animation conclusion

The needed chain is audio/phoneme timing → viseme weights → identity-preserving mouth/jaw deformation, plus separately driven blink, expression, and head motion. TTS audio amplitude alone only tracks loudness; it does not tell whether the speaker says /m/, /ee/, or /oh/. Face Landmarker is for observing a face, not synthesizing those phonemes. A browser CPU implementation therefore still needs a suitable licensed audio-to-viseme model and a compatible rig/warp model. No such model or validated rig is currently installed in the app, so the UI must not label the original photo as animated when only audio plays.

For the present product, keep the exact doctor photographs and existing patient-preview layout. Continue to play the first usable audio chunk immediately. Only display generated doctor video when the local video pipeline actually provides a valid synchronized video chunk; otherwise make the audio-only portrait limitation explicit. A worker-based MediaPipe/ONNX experiment is a separate, measurable follow-up—not a shortcut that by itself satisfies lip sync.

## Product scope decisions

- English, Hindi, and Kannada are the only consultation language choices exposed in this frontend.
- Patient notes added by this UI are stored only in local browser storage and are not a clinical record or synced account feature.
- Appointment requests use the existing specialist directory and request API. A request is not described as confirmed until the clinic confirms it.
- No paid templates, hosted avatar providers, new dependencies, or deployment actions are included.
