# MediCare – Design System Specification (Phase 4)

## 1. Design Vision & Philosophy
MediCare bridges **futuristic AI digital-human telemedicine** with the **reassurance and dignity of a premier clinical hospital environment**. 

The design avoids cartoonish graphics, excessive neon, and cluttered AI dashboards. Instead, it embodies:
- **Clinical Restraint & Authority**: Precision typography, clear visual hierarchy, and high contrast.
- **Deep Hospital Space**: Rich navy canvas (`#020617`, `#0B1120`) paired with surgical sky blues (`#38BDF8`), diagnostic cyan (`#06B6D4`), and empathetic violet (`#818CF8`).
- **Tactile Glassmorphism**: Multi-layered frosted glass (`backdrop-blur-2xl`) with specular hairline borders (`border-white/10`) simulating clean sterile medical monitors and HUDs.
- **Micro-Interactions**: Soft audio feedback, magnetic spring buttons, and smooth state transitions that confirm patient actions without overwhelming them.

---

## 2. Color Palette & Functional Tokens

### Background & Surface Hierarchy
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `bg-slate-950` | `#020617` | Canvas background — deep clinical night |
| `bg-slate-900` | `#0F172A` | Primary card & panel background |
| `bg-slate-800` | `#1E293B` | Input fields, secondary buttons, divider borders |
| `glass-panel` | `rgba(15, 23, 42, 0.75)` | Frosted glass with 20px blur and `border-white/10` |
| `glass-card` | `rgba(15, 23, 42, 0.65)` | Content card with 16px blur and `border-white/08` |
| `glass-pill` | `rgba(15, 23, 42, 0.85)` | Navigation and status pills with 12px blur |

### Primary & Brand Accents
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `sky-500` | `#0EA5E9` | Primary clinical action, active doctor indicator |
| `sky-400` | `#38BDF8` | Focus rings, highlighted clinical values, telemetry |
| `indigo-600`| `#4F46E5` | Secondary brand gradient stop, Dr. Smit secondary |
| `purple-500`| `#A855F7` | Wellness consultation accent, Dr. Ananya badge |
| `teal-400`  | `#2DD4BF` | Physiological telemetry, breathing animations |

### Clinical Triage Severity Levels
| Triage Level | Color Token | Hex Value | Clinical Meaning |
| :--- | :--- | :--- | :--- |
| **Level 1** | `emerald-400` | `#34D399` | General Education & Preventive Wellness |
| **Level 2** | `sky-400` | `#38BDF8` | Non-Urgent Outpatient Review (48–72h) |
| **Level 3** | `amber-400` | `#FBBF24` | Urgent Same-Day Doctor Video-Consultation |
| **Level 4** | `red-500` | `#EF4444` | Red-Flag Emergency (Immediate 112 / 108 Call) |

---

## 3. Typography
- **Display Headings**: `Urbanist`, system-ui, -apple-system, sans-serif (`tracking-tight`, weights `600` and `700`).
- **Body & Dialogue**: `Inter`, system-ui, sans-serif (15px base size, line-height 1.55, weight `400` and `500`).
- **Clinical Telemetry & Metrics**: `JetBrains Mono`, monospace (letter-spacing `0.05em`, weights `500` and `700`).

---

## 4. Spacing & Elevation
- **Spacing Units**: 4px base (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px).
- **Corner Radii**:
  - Controls, inputs, and chips: `rounded-xl` (12px)
  - Cards, modals, and viewports: `rounded-2xl` (16px) or `rounded-3xl` (24px)
  - Indicators and badges: `rounded-full` (9999px)
- **Shadows**:
  - Normal Card: `shadow-xl` (`0 20px 25px -5px rgba(0, 0, 0, 0.4)`)
  - Floating PiP / Modals: `shadow-2xl` (`0 25px 50px -12px rgba(0, 0, 0, 0.6)`)
  - Cyan Glow: `0 0 25px -3px rgba(56, 189, 248, 0.3)`
  - Indigo Glow: `0 0 25px -3px rgba(99, 102, 241, 0.3)`

---

## 5. Reusable Component Guidelines
- **Buttons**:
  - `Button` with variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `glass`, `shimmer`.
  - Magnetic pull micro-interaction on primary call-to-actions.
- **Card**:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - Built with frosted glass backdrop and subtle hover border glow.
- **Badges**:
  - Pill-shaped status badges with glowing live beacon dots.
- **Modals / Dialogs**:
  - Full-screen backdrop blur (`backdrop-blur-xl`) with focus trap and keyboard ESC dismiss.
