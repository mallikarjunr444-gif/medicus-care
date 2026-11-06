# Medicus Care — Free UI Component Ecosystem Integration

This document records the free / open-source component ecosystems that were researched and configured for the
Medicus Care frontend (`frontend/`), the exact tooling and commands, the licences, and what was implemented.

Scope is **frontend UI only**. Backend, AI models, doctor avatars, voice and lip-sync were not changed.

---

## 1. Decision summary

Medicus Care already ships its own light "botanical" design system
(`frontend/app/globals.css`, `frontend/styles/tokens.css`, `frontend/tailwind.config.js` and the in-use
`components/ui/clinical-primitives.tsx`). The landing page renders in this light register, while the in-app
consultation views use dark glass utilities.

The goal was "fully free, unlimited, local, source-code-based" — i.e. components are **copied into the repo as
editable source**, with no runtime package, no account and no quota. That narrows the field to three first-class
choices, plus two secondary ones:

| Priority | Platform | Licence | Why |
|---|---|---|---|
| **Primary** | **shadcn/ui** | MIT | The foundation + registry format + official MCP. |
| **Primary** | **Spectrum UI** | Apache-2.0 | 250+ animated components/blocks, free, no paid tier, MCP. |
| **Primary** | **Intelli UI** | MIT | 131+ Liquid Glass components, own CLI + MCP + agent skills. |
| Secondary | **AI Canvas** | MIT (free) / proprietary (Premium) | 208+ components; free tier needs a free account token. |
| Secondary | **EneUI** | upstream (MIT/Apache-2.0/ISC/undeclared) | Largest catalogue; free tier is rate-limited (10 copies/day). |
| Verify | **Particle UI** | not confirmed (auth-gated docs) | shadcn-compatible registry; verify licence before shipping. |

The three primary platforms are the only ones that are **fully free with no account and no per-day quota**, and all
three install plain source files you own and edit.

---

## 2. What was configured

| File | Purpose |
|---|---|
| `frontend/components.json` | shadcn-compatible config: aliases → existing paths, plus the `@aicanvas` registry. |
| `.mcp.json` (repo root) | MCP servers for Claude Code (and tools that read root `.mcp.json`). |
| `frontend/components/ui/input.tsx` | Light MediCare text input. |
| `frontend/components/ui/label.tsx` | Accessible form label. |
| `frontend/components/ui/textarea.tsx` | Light MediCare textarea. |
| `frontend/components/ui/skeleton.tsx` | Loading placeholder. |
| `frontend/components/ui/glass-card.tsx` | Light-register glassmorphism surface. |
| `frontend/components/ui/medical-info-card.tsx` | Reusable medical information card. |
| `frontend/components/interactive/MedicalInfoSection.tsx` | Landing section that composes the cards. |

`frontend/app/page.tsx` now renders `<MedicalInfoSection />` on the landing page.

> Note: `npx shadcn@latest init` was intentionally **not** run. It would rewrite `globals.css` and
> `tailwind.config.js` and clobber the existing MediCare design tokens. `components.json` is hand-authored so the
> shadcn MCP/CLI and third-party CLIs can still find the correct aliases without touching the theme.

---

## 3. Per-platform tools, commands and licences

### 3.1 shadcn/ui — `https://ui.shadcn.com`
- **Licence:** MIT.
- **CLI:** `npx shadcn@latest init` · `npx shadcn@latest add <component>`
- **MCP server:** `npx shadcn@latest mcp` (also `npx shadcn@latest mcp init --client claude|cursor|vscode|codex|opencode`)
- **Registry:** default registry needs no config; extra registries go in `components.json` under `registries`.

### 3.2 Spectrum UI — `https://ui.spectrumhq.in`
- **Licence:** Apache-2.0. Free, no paid tier.
- **Install:** `npx shadcn@latest add @spectrumui/<component>` (e.g. `@spectrumui/accordion`)
- **MCP server:** `npx -y @spectrumui/mcp`
- **Source:** `https://github.com/arihantcodes/spectrum-ui`
- 250+ blocks/components/variants; animated with Motion; Radix UI for accessibility.

### 3.3 Intelli UI — `https://ui.intellihelper.in`
- **Licence:** MIT.
- **CLI:** `npx @intellihelper/cli@latest init` · `npx @intellihelper/cli@latest add button card dialog`
- **MCP server:** `intellihelper-ui` — wire with `npx @intellihelper/cli@latest mcp init --client cursor`
- **Agent plugin (skills + MCP + commands):** `claude plugin marketplace add IntelliHelper/agent-skills`
- **Registry (shadcn-compatible):** `https://ui.intellihelper.in/r/registry.json`
- 131+ Liquid Glass components; great for the "glassmorphism" requirement.

### 3.4 AI Canvas — `https://aicanvas.me` (secondary)
- **Licence:** free library MIT; Premium components/design systems/templates are proprietary.
- **Install:** `npx shadcn@latest add @aicanvas/<component>` — requires a free account token
  (`AICANVAS_TOKEN` in `.env.local`, already wired in `components.json`).
- **MCP server:** `npx -y @aicanvas/mcp`

### 3.5 EneUI — `https://ui.eneawork.it` (secondary)
- **Licence:** components keep their upstream licence (MIT / Apache-2.0 / ISC / "not declared"). EneUI does not relicense.
- **CLI:** `npx eneui search "pricing table"` · `npx eneui add <library>/<name>`
- **MCP server (Streamable HTTP):** `https://ui.eneawork.it/mcp` (already in `.mcp.json`)
- **Free tier limits:** 10 copies/day, MCP 120 req/min. Not "unlimited free" — hence secondary.

### 3.6 Particle UI — `https://particleui.dev` (verify)
- shadcn-compatible registry (ships a `components.json` and `Particle Hero` docs).
- **Licence:** could not be confirmed from the public surface (docs redirect behind Clerk auth). Verify the licence
  in the project repo before pulling anything into a commercial build.

---

## 4. MCP configuration (for the coding agent)

`.mcp.json` (repo root) is already in place with the four confirmed servers:

```json
{
  "mcpServers": {
    "shadcn":      { "command": "npx", "args": ["shadcn@latest", "mcp"] },
    "spectrum-ui": { "command": "npx", "args": ["-y", "@spectrumui/mcp"] },
    "ai-canvas":   { "command": "npx", "args": ["-y", "@aicanvas/mcp"] },
    "eneui":       { "type": "http", "url": "https://ui.eneawork.it/mcp" }
  }
}
```

Other editors — add the same servers at these paths:

- **Cursor:** `.cursor/mcp.json` (same shape as above; enable it in Cursor Settings).
- **VS Code / Copilot:** `.vscode/mcp.json` (wrap the entries under a `servers` key).
- **Codex:** `~/.codex/config.toml` — `[mcp_servers.shadcn]` → `command = "npx"`, `args = ["shadcn@latest", "mcp"]`.
- **Intelli (all clients):** run `npx @intellihelper/cli@latest mcp init --client <client>` — it writes the right config itself.

---

## 5. Re-theming rule (keep the design system consistent)

Registry components from shadcn/Spectrum/Intelli/AI Canvas assume either shadcn's `bg-primary` semantic tokens or
the vendor's own glass tokens. Medicus Care does **not** use shadcn's HSL variables — it uses the botanical palette
in `tailwind.config.js` + `styles/tokens.css`. So any pulled component must be re-mapped before use:

| Vendor token | Medicus Care equivalent |
|---|---|
| `--primary` / `bg-primary` | `#0f7565` (accent), `#0f6257` (hover), `#0b5149` (active) |
| `--background` / `bg-background` | `#f5f8f6` (canvas), `#ffffff` (surface) |
| `--foreground` / text | `#183331` (ink), `#36564d` (secondary), `#687b74` (muted) |
| `--border` | `#e1e9e4` / `#dfe8e2` |
| `--destructive` | `#dc2626`; success `#16a34a`; warning `#d97706` |

The in-use primitives to match are `components/ui/clinical-primitives.tsx` (ClinicalButton / ClinicalCard /
ClinicalBadge) and the new `input / label / textarea / medical-info-card / glass-card` files. The older
`components/ui/button.tsx`, `card.tsx` and `badge.tsx` are an **unused dark slate/sky theme** and are not part of
the shipped design system.

---

## 6. Example agent prompts (after MCP is connected)

- "Find an animated login card from Spectrum UI and install it into `frontend`."
- "Search Intelli UI for a glass AI chat composer."
- "List the medical / card components in the shadcn registry."
- "Install the button, dialog and card components from the shadcn registry."

Each installed file must then be re-mapped to the palette in section 5 before it lands in a MediCare screen.

---

## 7. Licences (at-a-glance)

| Platform | Licence | Commercial use |
|---|---|---|
| shadcn/ui | MIT | Yes |
| Spectrum UI | Apache-2.0 | Yes (no reselling as a component library) |
| Intelli UI | MIT | Yes |
| AI Canvas (free) | MIT | Yes |
| AI Canvas (Premium) | proprietary | via Premium subscription |
| EneUI | upstream (MIT/Apache-2.0/ISC/undeclared) | per upstream licence |
| Particle UI | **unconfirmed** | verify first |

Copied components retain their own licence notice; Medicus Care itself is licensed under the repo's `LICENSE`.

---

## 8. 21st.dev — component catalog (2026 upgrade)

- **What:** community catalog of 12,000+ hand-crafted React + Tailwind + TypeScript components, templates and
  libraries. shadcn/ui-compatible; live previews and copyable TSX.
- **Licence:** each component is published by its author under that author's licence — check the component page.
  The 21st platform itself is a hosted product.
- **Pricing:** free tier = **2 component code retrievals / copies / installs per day** plus unlimited catalog
  search. Unlimited installs need a paid Builder plan. Search is always free. ([pricing](https://21st.dev/pricing))
- **MCP:** endpoint `https://21st.dev/api/mcp`, authenticated with an `x-api-key` header (create a key at
  https://21st.dev/mcp). Wired in `.mcp.json` as `21st`, reading `TWENTY_FIRST_API_KEY` from the environment.
- **CLI:** `npx @21st-dev/cli@latest init --client <cursor|claude|codex|vscode|devin>` (add `--write` to write the
  client config; `windsurf` is an alias for `devin`).
- **Agent skills:** 8 skills (`21st-ui-build`, `21st-ui-explore`, `21st-ui-review`, `21st-design-sync`,
  `21st-cli-use`, `21st-registry`, `21st-ai`, `21st-video`) indexed at
  `https://21st.dev/.well-known/skills/index.json`.
- **Setup:** add `TWENTY_FIRST_API_KEY=...` to `.env.local`, restart the MCP client, then ask the agent to search
  the catalog and install a component. Every installed file must be re-mapped to the MediCare palette (section 5).

Because 21st's free tier caps retrievals, the **unlimited** source-based workflow stays shadcn / Spectrum / Intelli;
21st is the discovery layer and a good source for hero/bento/effect patterns.
