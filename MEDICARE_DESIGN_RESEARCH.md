# MediCare design research and component selection

**Reviewed:** 2026-11-03 (Asia/Calcutta)
**Budget used:** ₹0. No dependencies, paid assets, or design subscriptions were added.

## References reviewed

| Site | What was reviewed | Design takeaway |
|---|---|---|
| [Dribbble healthcare dashboard](https://dribbble.com/tags/healthcare_dashboard_ui) | Public healthcare card and dashboard examples | Use clear grouping and calm spacing. Dribbble shots are inspiration, not licensed source assets. |
| [Dribbble telehealth dashboard](https://dribbble.com/tags/telehealth-dashboard) | Public video-consultation/dashboard examples | Keep the doctor video dominant and put conversation controls close to it. |
| [Mobbin](https://mobbin.com/) | Public landing page and product overview | The product library is the reference; detailed captures require opening the library, so no private screens were used. |
| [Awwwards](https://www.awwwards.com/) | Direct public page attempt | Timed out during retrieval; no design claims were based on it. |
| [shadcn/ui](https://ui.shadcn.com/) | Component foundation and [directory](https://ui.shadcn.com/docs/directory) | Native buttons, dialog semantics, readable focus states, and simple composable controls fit this app. |
| [Magic UI](https://magicui.design/) | Public component overview | Its free source components are available, but animation was unnecessary for the consultation controls. |
| [Aceternity UI](https://ui.aceternity.com/) | Public component catalogue and pricing navigation | The site includes both component access and paid all-access offerings; no component was selected because this product needs less visual effect. |
| [Spectrum UI](https://ui.spectrumhq.in/) | Public component catalogue | Useful component categories, but it would add another system and integration route without solving a current gap. |
| [React Bits](https://www.reactbits.dev/) | Public component/source overview | Copyable source is available; animated backgrounds and text effects were not appropriate for a clinical call screen. |
| [21st.dev](https://21st.dev/) | Public component and template catalogue | A discovery source with mixed components/templates; no item was adopted because per-item terms and need did not justify adding it. |

## Selection

The implementation uses the existing Next.js, Tailwind CSS, and Lucide React packages only. Their installed package metadata reports MIT, MIT, and ISC licences respectively. No external component source or image asset was copied into the project. The doctor photos already in `frontend/public/doctor/` remain the source of identity.

I did not add shadcn/ui, Magic UI, Aceternity UI, Spectrum UI, React Bits, or 21st.dev code. Existing Tailwind utilities and native accessible elements already provide the needed card, dialog, button, and responsive layout primitives. This avoids an extra dependency and keeps control styling consistent with the application.

## Design decisions implemented

- Calm clinical palette: warm light surfaces, dark blue-green primary controls, soft gray borders, and rose only for ending a call or urgent messaging.
- Doctor selection uses the two existing reference portraits in restrained profile cards. Removed the 3D tilt, parallax glow, and unsubstantiated claims about VAD and instant interruption.
- Consultation prioritizes the doctor video and a readable conversation panel. Language, elapsed time, voice, camera, mute, interrupt, and end-call controls remain visible and keyboard-labelled.
- Language selection uses keyboard-operable buttons with selected states and dialog semantics.
- Voice state text reflects actual microphone and consultation states. Partial speech appears as a live transcript; microphone and audio permission errors provide a typing fallback.
- Reduced motion continues to follow the existing global preference. No new animation library was added.
