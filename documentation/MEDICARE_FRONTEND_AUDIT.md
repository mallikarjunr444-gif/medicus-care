# MediCare – Frontend Architecture Audit (Phase 1)

## Executive Summary
This document provides a comprehensive technical audit of the **MediCare** telemedicine frontend application located in `medicus-care/frontend`. The audit identifies current architectural patterns, framework versions, component hierarchies, CSS systems, 3D WebGL implementations, and opportunities for modernization using established component libraries.

---

## 1. Core Framework & Build Environment
| Parameter | Current Version | Analysis & Status |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.1.6 (App Router) | Active App Router setup (`app/layout.tsx`, `app/page.tsx`). Utilizing client components (`'use client'`) for live WebGL and Web Speech. |
| **Runtime / React** | React 18.2.0 & React-DOM 18.2.0 | Stable React 18 concurrent features. React 19 peer-dependency conflicts avoided by choosing compatible UI primitives and Three.js direct hooks. |
| **Package Manager** | npm / pnpm | `node_modules` managed via npm/pnpm with clean lockfiles. |
| **Node.js Target** | `>=20.9.0` (Node 22 LTS verified) | Fully compatible with modern ECMAScript standards and WebGL 2.0. |
| **TypeScript** | TypeScript 5.x (`tsconfig.json`) | Strict typechecking enabled with `tsc --noEmit` passing with 0 errors. |

---

## 2. Directory Structure & Architecture
```
frontend/
├── app/
│   ├── globals.css          # Design system baseline, Tailwind directives, glassmorphic utilities
│   ├── layout.tsx           # Root HTML layout, font variables, QueryProvider, ErrorBoundary
│   ├── page.tsx             # Primary orchestrator for Home, Consultation, Studio, Admin views
│   ├── robots.ts            # SEO crawling rules
│   └── sitemap.ts           # Dynamic sitemap generator
├── components/
│   ├── 3d/                  # Three.js WebGL scenes (Hero3DScene, AnatomyViewer3D)
│   ├── interactive/         # Motion & micro-interactions (DoctorShowcase, TriageSimulator, TiltCard, MagneticButton, CursorGlow)
│   ├── doctor/              # Consultation suite (DoctorVideoCall, DoctorPhotorealisticViewport, useDoctorSpeech, Modals)
│   ├── video/               # Patient WebRTC / Webcam PiP components
│   ├── ui/                  # Reusable UI primitives (ConnectionStatus, ErrorBoundary)
│   ├── admin/               # Admin RAG and knowledge management console
│   └── providers/           # QueryProvider and context wrappers
├── lib/
│   ├── api.ts               # Axios client with JWT interceptors for backend integration
│   ├── audioEffects.ts      # Zero-dependency Web Audio API synthesizer for tactile UI sound cues
│   ├── doctorTypes.ts       # Type definitions for Doctor Profiles, Triage Levels, Languages
│   ├── medicalConsultationEngine.ts # Context-aware conversational AI engine with session memory
│   └── useConnectionManager.ts # Centralized connection state coordinator
└── store/
    └── useStore.ts          # Zustand store with persistence for auth, session, and preferences
```

---

## 3. Styling & Design System Audit
- **CSS Architecture**: Tailwind CSS 3.3.0 with PostCSS and Autoprefixer.
- **Color Tokens**:
  - `slate-950` (`#020617`) and `slate-900` (`#0f172a`) as deep hospital cyber-clinical canvas.
  - `sky-500` / `sky-400` as primary clinical accent.
  - `indigo-600` / `purple-500` as secondary wellness accents.
  - `emerald-500` for normal/safe triage status.
  - `amber-500` for urgent/caution triage status.
  - `red-500` for Level 4 emergency triage escalation.
- **Surface Elevation**: Glassmorphism utilities (`glass-panel`, `glass-card`, `glass-pill`, `specular-border`) utilizing `backdrop-filter: blur(20px)` and hairline borders (`border-white/10`).
- **Icons**: Lucide React 0.316.0 providing unified, tree-shakable SVG medical and navigation icons.

---

## 4. 3D & Digital Human Implementation Audit
1. **Hero 3D Scene (`components/3d/Hero3DScene.tsx`)**:
   - Interactive Three.js WebGL scene with ACESFilmicToneMapping.
   - Procedural rotating double helix DNA core with 34 rungs, nucleotide spheres, and dual-layer wireframe icosahedrons.
   - 6 orbiting interactive raycasted biomarker nodes with live HUD telemetry display.
   - Dual-mode switch between Bio-Core Hologram and 3D Doctor Hologram.
2. **Anatomical Organ Explorer (`components/3d/AnatomyViewer3D.tsx`)**:
   - WebGL biological systems (Cardiovascular with systolic pumping, Neuro-Synaptic with synaptic bursts, Pulmonary with breathing, Cellular Nanosphere).
   - Mouse 360° drag orbit, wireframe mode, and live clinical telemetry.
3. **Photorealistic AI Doctor Viewport (`components/doctor/DoctorPhotorealisticViewport.tsx`)**:
   - High-resolution photographic digital human base portraits for Dr. Arjun (`/doctor/dr_arjun.jpg`) and Dr. Ananya (`/doctor/dr_ananya.jpg`).
   - Real-time audio-driven viseme lip-sync (`AA`, `EE`, `OO`, `M`, and `Rest`) driven by speech volume and phoneme frequency.
   - Physiological eye blinking (125ms natural sinusoidal curve every 2.8s–4.5s).
   - Sinusoidal respiration chest expansion (14 breaths/min).
   - Conversational head kinematics (attentive listening nods, thoughtful thinking gaze tilt, cadenced speaking motion).

---

## 5. Multilingual & Medical Consultation Audit
- **Language Gate**: `LanguageSelectionModal.tsx` prompts the patient to choose from 9 regional Indian languages before starting consultation.
- **Conversational Memory**: `medicalConsultationEngine.ts` maintains session-level state (`chiefComplaints`, `duration`, `character`, `associatedSymptoms`, `triageLevel`, `stage`, `askedQuestionKeys`), preventing repetitive questions.
- **Emergency Escalation**: Automatic Level 4 routing for acute red-flag symptoms with localized emergency triggers for **Chikkamagaluru, Karnataka, India** (Emergency 112 / 108 Ambulance, District Hospital Chikkamagaluru).

---

## 6. Recommendations & Improvement Roadmap
1. **Component Library Integration**: Incorporate reusable component patterns from **shadcn/ui** (Dialog, Card, Badge, Tabs, Button, Input) to establish consistent component APIs.
2. **Motion & Micro-Interaction Enhancements**: Add high-impact animated UI patterns inspired by **Aceternity UI** (Background Beams / Glowing Grid, Shimmer Buttons, Border Beam, Moving Border) and **Magic UI** (Number Tickers, Animated Text) without introducing heavy duplicate libraries.
3. **Zero Layout Shifts**: Eliminate any remaining dead space between consultation viewport and bottom control toolbar.
4. **Comprehensive Documentation**: Maintain `MEDICARE_COMPONENT_SELECTION.md`, `MEDICARE_DESIGN_SYSTEM.md`, and `MEDICARE_IMPLEMENTATION_REPORT.md`.
