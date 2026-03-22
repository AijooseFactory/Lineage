# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lineage is a genealogy intelligence platform — not a family-tree viewer. It combines:
- A canonical genealogy database (Gramps Web / Gramps Web API forks)
- A data validation and review layer for genealogical rigor
- A dataset generation pipeline (GEDCOM → canonical DB → normalized JSON → JSONL)
- A local fine-tuning stack (Unsloth Recipes + Apple MLX + Ollama)
- A specialized genealogy/genetic genealogy assistant runtime

**Core philosophy**: The database is truth. The model is the specialist analyst. The application coordinates both.

## Repository Structure

```
Lineage/                            # Gramps Web fork (frontend)
├── ONBOARDING.md                   # Full project vision and architecture spec — read first
├── src/                            # Frontend source (LitElement web components)
│   ├── GrampsJs.js                 # Root component (<gramps-js>)
│   ├── api.js                      # All API calls, auth helpers, localStorage utilities
│   ├── appState.js                 # App-wide state initialisation
│   ├── components/                 # Reusable components
│   ├── views/                      # Page-level components
│   ├── mixins/                     # LitElement mixins
│   └── charts/                     # D3.js visualisation components
├── lang/                           # Translation JSON files (one per language code)
├── _lineage-api/                   # Gramps Web API fork (Python backend)
└── _lineage-fine-tuning/           # ML fine-tuning stack (private, not in public repo)
    └── gedcom-files/               # Raw GEDCOM exports and family media
```

## Frontend (Gramps Web fork)

### Tech stack
- **LitElement (Web Components)** — every UI element is a custom element
- **Rollup** v4 for production builds; `@web/dev-server` for development
- **Material Web Components** — UI primitives. Mix of old `@material/mwc-*` and new `@material/web`. **New code must use `md-*` elements only.**
- **D3.js** — genealogical charts (fan chart, tree, relationship, Y-DNA lineage)
- **MapLibre GL** — interactive maps
- **MDI icons** via `@mdi/js` — SVG paths rendered through `<grampsjs-icon>`. **New code must always use `<grampsjs-icon>`, not `<mwc-icon>`.**

### Commands
```
npm start            # dev server on port 8001 (hot reload; no backend included)
npm run build        # production build → dist/
npm run lint         # ESLint check
npm run format       # Prettier fix
npm run typecheck    # TypeScript type-check
npm test             # run tests once with coverage
npm run test:watch
```

Build-time env vars: `API_URL` (default: same origin; dev fallback `http://localhost:5555`), `BASE_DIR`.

### Component conventions

**Naming**: All components use the `Grampsjs` prefix with lowercase `js` (e.g. `GrampsjsPersonCard`). Files using `GrampsJs` are legacy — do not follow that pattern.

**Base classes**:
| Base class | Use for |
|---|---|
| `GrampsjsView` | Page-level views (only renders when `active`) |
| `GrampsjsConnectedComponent` | Components that fetch API data on mount |
| `LitElement` + `GrampsjsAppStateMixin` | Everything else that needs `appState` or translations |

**Icons**:
```js
import {mdiInformation} from '@mdi/js'
html`<grampsjs-icon path="${mdiInformation}"></grampsjs-icon>`
```

**Mixins**:
- `GrampsjsAppStateMixin` — adds `appState` and the `_(key)` translation helper
- `GrampsjsStaleDataMixin` — marks data stale on `db:changed`; refetches when component becomes active

### State management

`appState` is a plain object (no Redux) initialised in `appState.js`, passed down as a Lit property. Always use its API methods — do not call `api.js` HTTP functions directly:

```js
const result = await this.appState.apiGet('/api/people/')
await this.appState.apiPost('/api/people/', payload)
await this.appState.apiPut('/api/people/handle', payload)
await this.appState.apiDelete('/api/people/handle')
```

Use `api.js` imports only for non-HTTP utilities: `getMediaUrl`, `getThumbnailUrl`, `getExporterUrl`, `getSettings`, `updateSettings`, `addBookmark`.

Data flows down via Lit properties, up via custom events through `fireEvent`. No shared mutable state between siblings.

### Custom events

| Event | Meaning |
|---|---|
| `db:changed` | A mutation succeeded; stale data should be refreshed |
| `user:loggedout` | Auth was cleared |
| `settings:changed` | User settings were updated |
| `grampsjs:error` | A component encountered an error (bubbles up to root) |

Fire with `fireEvent(target, eventName, detail?)` from `util.js`.

### Auth

JWTs in `localStorage` (`access_token`, `refresh_token`, `id_token`). The `Auth` class in `api.js` handles proactive token refresh. OIDC login/logout supported.

Permissions via `appState.permissions`: `canAdd`, `canEdit`, `canViewPrivate`, `canManageUsers`, `canUseChat`, `canUpgradeTree`.

### i18n

All translatable text goes through `_(key)` (available in any component using `GrampsjsAppStateMixin`).

- **Gramps strings** (exist in Gramps desktop): add to `grampsStrings` in `src/strings.js` — backend serves translations
- **Frontend-only strings**: add English text to `lang/en.json` — do not cross these two sources

### TypeScript

Optional — new files may be `.ts`, existing `.js` stays as-is. Production build uses `@rollup/plugin-typescript`; dev server uses esbuild. Lit decorators (`@customElement`, `@property`, `@state`) from `lit/decorators.js`; `experimentalDecorators` and `useDefineForClassFields: false` are set in `tsconfig.json`.

### Runtime configuration

`src/config.js` is excluded from the bundle and copied as-is to `dist/config.js`. Deployers mount a replacement in Docker to set `window.grampsjsConfig` (custom API URL, OAuth config). Default is `window.grampsjsConfig = {}`.

### Code style

ESLint + Prettier enforced via husky/lint-staged on commit. Prettier: single quotes, no semicolons, no arrow-function parens for single args, no bracket spacing.

## Backend (`_lineage-api/`)

The `_lineage-api/` directory is the Gramps Web API fork — a Python backend providing structured access to genealogy data (people, families, events, places, sources, citations, notes, repositories, media).

Fork from GitHub **only if** Gramps Web API lacks a capability required by Lineage. Prefer upstream contributions or workarounds over forking unnecessarily.

## Fine-tuning stack (`_lineage-fine-tuning/`)

**Not part of the public GitHub repo.** Contains sensitive genealogy data (GEDCOM, media) used solely for fine-tuning `lineage-gpt-oss:120b` locally via Apple MLX, then deploying via Ollama.

## Architecture Decisions

### Intended data flow
```
GEDCOM / media
  → Gramps Web API (canonical DB)
  → Normalized genealogy JSON
  → JSONL training datasets (Unsloth Recipes)
  → Fine-tuned model (Apple MLX)
  → Deployed assistant (Ollama)
```

### Five-phase build order
1. Ingest GEDCOM and media into Gramps Web, clean and verify
2. Establish canonical truth — source/citation integrity, identity anchors
3. Generate structured JSONL datasets for genealogy and genetic genealogy behavior
4. Fine-tune local model with MLX, deploy to Ollama
5. Operate the assistant against the live database

## Key Constraints

- **Correctness over polish**: Genealogical validity matters more than UI finish or conversational fluency.
- **Database verifies; model specializes**: The fine-tuned model teaches behavior and reasoning style — it is not the source of record. At runtime, the live DB is always truth.
- **Incremental**: Establish genealogy core → clean imports → validate sources → build extraction → build datasets → train → improve.
- **Local and private**: Fine-tuning data and trained models are intended for local deployment, not cloud hosting.
