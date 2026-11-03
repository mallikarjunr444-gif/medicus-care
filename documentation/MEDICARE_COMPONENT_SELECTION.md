# MediCare – Component Selection Matrix (Phases 2 & 3)

## Architectural Principle
Rather than installing dozens of incompatible external packages that bloat the bundle and create React 18/19 peer dependency conflicts, MediCare follows the **shadcn/ui & Aceternity UI design philosophy**:
1. Copy-and-own modular components in `components/ui/` with zero lock-in.
2. Full accessibility using semantic HTML, ARIA attributes, and keyboard navigation.
3. GPU-accelerated CSS keyframes and Three.js WebGL for high-performance 60 FPS rendering.
4. Clean composition using `clsx` and `tailwind-merge` (`cn` helper).

---

## Component Selection Matrix

| Module / Area | Component Name | Source / Inspiration | Purpose & UI Role | Implementation / Dependencies | Accessibility & Performance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Foundation** | `cn` utility | shadcn/ui | Class merging with conflict resolution | `clsx` + `tailwind-merge` | Zero runtime overhead |
| **Foundation** | `Button` | shadcn/ui | Primary, secondary, ghost, danger, outline buttons | Modular React forwardRef component | Keyboard focus visible, ARIA button |
| **Foundation** | `Badge` | shadcn/ui | Clinical status, triage levels, and language tags | Variant-driven badge styles | Crisp text contrast, semantic span |
| **Foundation** | `Card` | shadcn/ui | Structured information container | Card, CardHeader, CardTitle, CardContent | Semantic sectioning, responsive padding |
| **Foundation** | `Tabs` | shadcn/ui | Mode switcher (Bio-Core vs Doctor, Organ Systems) | Controlled accessible tabs | `role="tablist"`, keyboard arrows |
| **Hero Background** | `BackgroundBeams` | Aceternity UI | Subtle cyber-clinical light rays in hero backdrop | SVG path animation with linear gradients | GPU-composited, hidden from screen readers |
| **Visual Accent** | `BorderBeam` | Magic UI | Luminous glowing border moving along card perimeter | CSS `@keyframes` on pseudo-element | Hardware-accelerated, zero JS thread cost |
| **Interactive CTA** | `ShimmerButton` | Magic UI | Glowing shimmer effect on primary consultation action | Pure CSS shimmer gradient + Tailwind | Semantic `<button>` with focus ring |
| **3D Interactive** | `Hero3DScene` | Three.js + 21st.dev | Holographic DNA bio-helix & orbiting biomarker nodes | Three.js WebGL + Raycaster + ACESFilmic | Clamped DPR (max 2), RAF pause on blur |
| **3D Anatomy** | `AnatomyViewer3D` | Three.js + Spline-inspired | 3D Organ systems (Cardiovascular, Neural, Pulmonary, Cellular) | Procedural Three.js geometries + 360° drag | Memory-managed geometry disposal |
| **Doctor Showcase** | `TiltCard` | React Bits / Aceternity | 3D perspective tilt on hover with specular glare | Spring CSS transform3d + radial glare | `prefers-reduced-motion` compliance |
| **Micro-Interaction** | `MagneticButton` | React Bits | Magnetic pull towards cursor on hover | Pointer coordinate tracking + damping | Spring reset on mouse leave |
| **Micro-Interaction** | `CursorGlow` | Aceternity UI | Ambient radial light follower across glassmorphism | Pointer event listener with blur layer | Disabled on mobile touch devices |
| **Audio Synthesizer** | `soundFX` | Web Audio API / Magic UI | Tactile chimes for click, hover, pulse, and ping | Zero-dependency AudioContext synthesizer | AudioContext created on first gesture |
| **Document Scanner** | `LabReportScanner3D` | 21st.dev | 3D Holographic lab report with sweeping laser | Animated laser scanline + test breakdown | Tab navigation, high-contrast labels |
| **Safety Governance** | `MedicalSafetyRadar` | Aceternity / Magic UI | 4-Tier Medical Architecture with radar pulse | CSS radar scale keyframe + detail drawer | Semantic triage level indicators |
| **Consultation View** | `DoctorPhotorealisticViewport` | Digital Human / Three.js | Photorealistic live AI doctor with audio lip-sync | High-res photographic portraits + canvas visemes | 60 FPS, 125ms natural blink curve |
| **Language Gate** | `LanguageSelectionModal` | shadcn/ui Dialog | First-step pre-consultation language selection | Glassmorphism modal with 9 native scripts | Focus-trapped, ESC close, accessible cards |
| **Patient Camera** | `PatientWebcamPiP` | WebRTC / 21st.dev | Floating picture-in-picture with minimize/maximize | HTML5 `video` + `MediaStream` API | Responsive 16:9, camera & mic toggles |

---

## Detailed Component Specifications

### 1. `components/ui/button.tsx` (shadcn/ui style)
- **Variants**: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`, `glass`, `shimmer`.
- **Sizes**: `sm` (h-8 px-3), `default` (h-10 px-4), `lg` (h-12 px-6), `icon` (h-10 w-10).

### 2. `components/ui/card.tsx` (shadcn/ui style)
- **Parts**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Glassmorphic styling**: `glass-panel` background with subtle white/10 border and frosted backdrop blur.

### 3. `components/ui/badge.tsx` (shadcn/ui style)
- **Variants**: `default` (sky), `secondary` (slate), `destructive` (red), `outline` (border-only), `success` (emerald), `warning` (amber).

### 4. `components/ui/background-beams.tsx` (Aceternity UI inspired)
- Emits soft clinical cyan and violet particle paths across the hero section with zero layout shift.

### 5. `components/ui/border-beam.tsx` (Magic UI inspired)
- Animates an infinite glowing ray along the borders of featured doctor cards.
