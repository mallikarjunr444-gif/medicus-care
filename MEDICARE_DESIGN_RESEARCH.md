# MediCare design research and selections

## Sources I could and could not inspect
- Reachable: GitHub repo `nexu-io/open-design` (cloned and read), web search results for licences.
- Not reachable from the build sandbox (blocked by its network allowlist): Dribbble, Mobbin, Awwwards, and the component sites themselves. They were not inspected, so no layout was copied from them.

## Licence check
| Resource | Licence found | Decision |
|---|---|---|
| shadcn/ui conventions | MIT | Followed (own `components/ui`) |
| Magic UI | MIT | Pattern only: a small dependency-free scroll reveal (`components/ui/reveal.tsx`) |
| Spectrum UI | Apache-2.0 | Not needed |
| React Bits | MIT + Commons Clause | Skipped (licence restricts selling) |
| Aceternity UI | Free-tier terms not verifiable | Skipped |
| Open Design (nexu-io) | Apache-2.0 | Used: token structure (spacing, section rhythm, radii, type scale) and its `craft/` checklists. Notice in `docs/THIRD_PARTY_NOTICES.md` |
| Inter, Urbanist (fontsource) | OFL-1.1 | Used, self-hosted |

No paid asset, template or font was added.

## Design decisions
- Identity moved from evergreen to medical blue and white (`primary-600 #0b63ce`), with legacy teal/emerald utilities remapped to the same scale.
- Tokens in `frontend/styles/tokens.css`; muted text `#4f6580` (AA on the page background).
- Navigation: five primary items plus a More menu; mobile keeps the bottom bar.
- Landing: added How it works, Safety and privacy (only claims backed by the code), CTA and a full footer. No invented certifications, partners or testimonials.
- Checked with axe (WCAG 2 A/AA) on home and the consultation screen at desktop and mobile.
