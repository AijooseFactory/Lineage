# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lineage is a genealogy intelligence platform — not a family-tree viewer. It combines:
- A canonical genealogy database — a Gramps-compatible family tree database (SQLite by default, PostgreSQL supported) that the Lineage API backend owns and manages directly. This is not a separate external database; the API reads and writes it in the same way Gramps Desktop does, using the same data model.
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
  → Lineage API (imports into the Lineage genealogy database)
  → Normalized genealogy JSON (extracted from the DB)
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

## Rebranding (Lineage vs Gramps Web)

The frontend is whitelabelled — user-visible "Gramps Web" text is replaced with "Lineage" while code identifiers (class names, element names, file format references like "Gramps XML") are left unchanged to keep the upstream fork relationship clean.

**Files changed and what to check after an upstream merge:**

| File | Change | Risk |
|---|---|---|
| `index.html` | Title and meta tag text | Low — stable boilerplate; conflict is a one-liner |
| `manifest.json` | `name` / `short_name` fields | Low — same |
| `src/components/GrampsjsAppBar.js` line ~81 | Fallback title `'Gramps Web'` → `'Lineage'` | Low — one line |
| `lang/en.json` | **Values** only (right side of each pair) changed; keys left as-is | Medium — see below |

**`lang/en.json` key-rename risk**: Translation keys and English values are the same string in this file (e.g., `"Welcome to Gramps Web": "Welcome to Lineage"`). If upstream renames a key (rare), the old key is orphaned and the new key reverts to showing the Gramps Web English text. After any upstream pull, run:

```bash
grep -n "Gramps Web" lang/en.json
```

Any hit in a *value* (right side) means that string needs updating. Hits in *keys* (left side) are expected and intentional — do not change them.

**Strings intentionally left unchanged** (file format names, not app branding):
- `"The Gramps package format (.gpkg) is currently not supported."`
- `"Please upload a file in Gramps XML (.gramps) format without media files."`

### Upstream contributions

Some Lineage additions are good candidates for contributing back to Gramps Web upstream. When identifying such changes, note them here but **do not create upstream PRs during development** — evaluate after each feature stabilises. Changes worth considering for upstream:

- Ollama embedding backend in `embeddings.py` (additive, backwards-compatible, no Lineage branding)
- `DEFAULT_MIN_ROLE_AI` config fallback in `auth/__init__.py` (useful for any deployment where per-tree config hasn't been set)
- Provider-prefix detection fix in `agent.py` (bug fix — model tags with `:` should not be treated as pydantic-ai provider strings when `base_url` is set)
- **Media ZIP import basename fallback** in `media_importer.py` + `media.py` (bug fix — GEDCOM files from Family Tree Maker and similar apps store absolute host-machine paths; the importer now falls back to matching by filename when no exact relative-path match exists, and updates the stored path in the DB; also adds proper logging to upload failures)

## AI Chat — Local Ollama Configuration

Lineage runs AI Chat against a local Ollama instance (Ollama Desktop on the Mac host), not a cloud AI API.

### Environment variables (set in `docker-compose.dev.yml` + sourced from `Lineage/.env`)

| Variable | Value | Purpose |
|---|---|---|
| `GRAMPSWEB_VECTOR_EMBEDDING_MODEL` | `qwen3-embedding:8b` | Ollama embedding model for semantic search |
| `GRAMPSWEB_LLM_BASE_URL` | `http://host.docker.internal:11434/v1` | Ollama OpenAI-compatible endpoint on the Mac host |
| `GRAMPSWEB_LLM_MODEL` | `gpt-oss:120b-cloud` | Active LLM for chat (Ollama Cloud authenticated) |
| `OPENAI_API_KEY` | `ollama` | Sentinel value required by the pydantic-ai OpenAI-compatible client |
| `OLLAMA_API_KEY` | *(in `.env`, never hardcoded)* | Authenticates `:cloud` model requests through Ollama Cloud |
| `GRAMPSWEB_DEFAULT_MIN_ROLE_AI` | `4` | Minimum user role required for AI chat access: 0=Everyone, 1=Member+, 2=Contributor+, 3=Editor+, 4=Owner/Admin, 99=Nobody. Defaults to `None` (disabled). Dev is set to `4` (Owners and Admins). Overridable per-tree in Manage Users. |
| `GRAMPSWEB_LLM_SYSTEM_PROMPT` | *(optional, from `.env`)* | Runtime override for the agent system prompt. Uncomment in `docker-compose.dev.yml` and set `LINEAGE_SYSTEM_PROMPT` in `.env`. Leaves `agent.py` untouched. |

**Hostname rule**: Ollama Desktop runs on the Mac host, so the URL must be `http://host.docker.internal:11434/v1`. Do **not** change this to `http://ollama:11434/v1` unless Ollama is moved into the Docker Compose network as its own service.

### Embedding model — Ollama vs SentenceTransformer (additive, not a replacement)

`_lineage-api/gramps_webapi/api/search/embeddings.py` supports both backends:

- **Ollama path**: activated when `VECTOR_EMBEDDING_MODEL` contains `:` (Ollama tag format, e.g. `qwen3-embedding:8b`) **and** `LLM_BASE_URL` is set. Calls `POST {LLM_BASE_URL}/embeddings` using the `openai` Python library. No local model download.
- **SentenceTransformer path**: used for all other model names (HuggingFace-style, e.g. `sentence-transformers/all-MiniLM-L6-v2`). Downloads and caches the model locally. This is the original upstream behaviour and is fully preserved.

SentenceTransformer is the upstream default; Ollama support is a Lineage addition. Upstream changes to the SentenceTransformer path should merge cleanly.

### After any model or config change

```bash
# Rebuild the API image (Python source changes require a rebuild)
docker compose -f /Users/george/_dev/docker-compose.yml build dev-dev-lineage-api

# Restart the stack
docker compose -f /Users/george/_dev/docker-compose.yml up -d

# Run Alembic users-DB migrations (run after every API rebuild that adds migrations)
docker exec dev-lineage-api bash -c "cd /app/src && python3 -m alembic upgrade head"

# Rebuild the semantic search index (via the admin API)
curl -X POST http://localhost:5555/api/search/index/semantic \
     -H "Authorization: Bearer <admin-jwt>"
```

AI chat access defaults to **Owners and Admins** (role ≥ 4) via `GRAMPSWEB_DEFAULT_MIN_ROLE_AI`. This can be overridden per-tree in **Settings → AI Settings → Chat Access** at runtime. The per-tree setting (`tree_obj.min_role_ai`) takes precedence when set; otherwise the server-wide default applies.

### AI Settings tab (Settings → AI Settings)

Accessible from the top-right preferences menu → Settings → AI Settings tab. Visible to **Owners and Admins only** (`canManageUsers` permission gate).

The tab contains three sections:

1. **System Prompt** — editable textarea (monospace, 8 000-char limit) for a per-tree custom system prompt. Shows a Default/Custom status pill. Changes auto-saved as a draft to `localStorage` key `lineage:chat-prompt-draft`. Save button PUTs to `/api/trees/-`. Restore Default clears the custom prompt. Data fetched from `/api/trees/-` on mount.

2. **Chat Access** — embeds `<grampsjs-chat-permissions>` to set the minimum user role that can access AI chat for this tree.

3. **Researcher Information** — name, email, phone, and address from `appState.dbInfo.researcher` (populated from `/api/metadata/`). Gated by `!appState.frontendConfig?.hideResearcherDetails`. This content was formerly its own Settings tab; it was merged here as the initial framework for Lineage Deep Research. The standalone `GrampsjsViewResearcher.js` file is still on disk but **no longer imported or mounted** — it is orphaned and can be deleted when a cleanup pass is done.

#### System prompt priority chain

```
1. Per-tree DB value  (system_prompt_ai column in users SQLite trees table)
2. Env var            GRAMPSWEB_LLM_SYSTEM_PROMPT  (set in .env / docker-compose)
3. Hardcoded default  SYSTEM_PROMPT constant in gramps_webapi/api/llm/agent.py
```

The per-tree value is set/cleared via the AI Settings UI and stored by `set_tree_details(system_prompt_ai=...)` in `auth/__init__.py`. An empty string clears the custom prompt and reverts to the next level.

### Agent behaviour — no-fabrication rules

The `SYSTEM_PROMPT` in `agent.py` is structured so the no-fabrication constraint appears **before** any role or tone instruction, ensuring the model reads it first:

- **READ-ONLY window**: the agent may only state facts that a tool call returned during the current conversation. Nothing from prior knowledge.
- **Relationships are highest-risk**: terms like "grandfather", "uncle", "cousin" may only be used after `filter_people` with `show_relation_with` has returned that exact label for the target handle.
- **Discrepancy detection**: if the user refers to someone with a specific relationship (e.g. "my great-great-grandfather George") but the tool returns a different label (e.g. great-great-granduncle), the agent must correct it gently and alert the user to the discrepancy rather than confirming the wrong relationship.

### Thinking model support

Lineage runs a **thinking model** (currently `gpt-oss:120b-cloud` via Ollama Cloud). The response pipeline:

```
Model emits:
  <think>…</think>           ← model-native chain-of-thought (stripped completely)
  <thought>…</thought>       ← visible reasoning block (extracted for UI)
  {prose answer}             ← final answer shown to user

Backend pipeline (llm/__init__.py + tasks.py):
  1. strip_native_thinking()  → removes <think> tokens
  2. sanitize_answer()        → strip_native_thinking + URL cleanup + markdown cleanup
  3. extract_thought_block()  → splits (thought, answer) tuple
  4. tasks.py returns {"response": answer, "thought": thought} to frontend

Frontend (GrampsjsChat.js + GrampsjsChatMessage.js):
  - Reads separate `data.data.response` and `data.data.thought` fields
  - Falls back to legacy <thought>…</thought> parsing for old history entries
  - Thought shown as collapsible <details>/<summary> panel (CSS-only chevron)
  - Answer streams word-by-word; thought appears immediately collapsed
```

### Agent tools

| Tool | Purpose |
|---|---|
| `get_current_date` | Returns today's ISO date |
| `search_genealogy_database` | Semantic search via SQLite FTS index |
| `filter_people` | Filter by name, birth/death, ancestry, gender, relationship |
| `filter_events` | Filter events by type, date, place, participant |
| `get_enslaved_ancestors` | Walk ancestor chain; return those with enslaved-status evidence |
| `get_enslavers_of_ancestors` | Scan enslaved ancestors' notes for planter/estate references |
| `hybrid_search` | Hybrid GraphRAG: Weaviate + Neo4j + canonical DB (conditional) |

### Hybrid GraphRAG (`LINEAGE_HYBRID_RAG_ENABLED=true`)

Three-layer pipeline in `gramps_webapi/api/lineage/`:

1. **Weaviate** — semantic vector search over `NoteChunk`, `MediaChunk`, `SourceChunk` collections. Each note/source/media object is chunked and embedded via `qwen3-embedding:8b` (Ollama).
2. **Neo4j** — graph relationship traversal (`CHILD_OF`, `SPOUSE_OF` edges). 2,535 persons, 2,027 `CHILD_OF` edges, 15,760 citations projected.
3. **Canonical Gramps DB** — full person records fetched by handle to enrich graph-only results.

**Key files:**

| File | Role |
|---|---|
| `api/lineage/clients.py` | `Neo4jClient`, `WeaviateClient` singletons |
| `api/lineage/intent_parser.py` | Typed `IntentResult`; no model-generated Cypher |
| `api/lineage/retriever.py` | `hybrid_retrieve()` orchestrator + graceful fallback |
| `api/lineage/vector_projector.py` | `project_full()` — embeds all notes/sources/media into Weaviate |
| `api/lineage/graph_projector.py` | `project_graph()` — writes persons + relationships to Neo4j |
| `api/lineage/normalizer.py` | `normalize_person()`, `normalize_note()`, etc. |
| `scripts/lineage_reindex.py` | Admin CLI: full reindex without HTTP API or Celery |

**Projection trigger** (after any bulk data change):
```bash
docker exec dev-lineage-api python3 /app/src/scripts/lineage_reindex.py
```
Or via the HTTP API with an admin JWT:
```bash
curl -X POST http://localhost:5555/api/search/index/semantic \
     -H "Authorization: Bearer <admin-jwt>"
```

**Weaviate object counts (fully projected, as of latest reindex):**
- `NoteChunk`: ~6,005 (from 5,823 notes — long notes create multiple chunks)
- `SourceChunk`: 209
- `MediaChunk`: 1,164

**Neo4j relationship counts (fully projected):**
- 2,535 Person nodes
- 2,027 `CHILD_OF` edges (person→parentFamily)
- 3,870 `PARENT_OF` edges (parent→child, direct person-to-person)
- Persons connected by SPOUSE_OF via Family nodes

**Bilateral ancestor traversal fix**: The original Cypher used `(target)-[:CHILD_OF|SPOUSE_OF*1..N]->` (outbound only). Since SPOUSE_OF goes FROM person TO family (not from family to person), following it outbound from a Family node found nothing — both maternal and paternal ancestor lines were silently missing from `hybrid_search` results. Fix: added `PARENT_OF` direct person→person edges at projection time, updated Cypher to use `(ancestor)-[:PARENT_OF*1..N]->(target)` for ancestor queries.

### Tree name resolution — `get_db_manager` fix

Gramps stores databases by UUID dirname (e.g., `e3a54d56-88e7-4517-a910-81cda8f60033/`) with a `name.txt` containing the human-readable name ("Lineage"). The API `tree` parameter is the **human-readable name**, not the UUID.

`get_db_manager()` in `util.py` resolves this: checks if `tree` is a literal existing directory first; if not, passes it as `name=` (human-readable lookup). The `lineage_reindex.py` script auto-discovers the UUID by scanning `name.txt` files.

### Files changed from upstream

**Backend (`_lineage-api/`):**

| File | Change |
|---|---|
| `gramps_webapi/api/search/embeddings.py` | Added `OllamaEmbeddingModel` class; extended `load_model()` to accept `base_url` + `api_key`; Ollama detected by `:` in model name + base_url present |
| `gramps_webapi/app.py` | Passes `LLM_BASE_URL` and `OLLAMA_API_KEY` env var to `load_model()` at startup |
| `gramps_webapi/config.py` | Added `DEFAULT_MIN_ROLE_AI = None` to `DefaultConfig` |
| `gramps_webapi/auth/__init__.py` | Tree model: `system_prompt_ai` mapped column; `get_tree_permissions()` returns it; `set_tree_details()` accepts it; `get_permissions()` falls back to `DEFAULT_MIN_ROLE_AI` when tree value is `None` |
| `gramps_webapi/api/llm/agent.py` | Fixed Ollama tag provider-detection bug; rewrote `SYSTEM_PROMPT` — mandatory `<thought>` block, no-fabrication rules, enslaver tools guidance; registered `get_enslaved_ancestors` + `get_enslavers_of_ancestors` + `hybrid_search` |
| `gramps_webapi/api/llm/__init__.py` | `answer_with_agent()` + thinking model pipeline: `strip_native_thinking()`, `extract_thought_block()`, `sanitize_answer()`; per-tree system prompt priority chain; `extract_user_identity_from_history()` |
| `gramps_webapi/api/llm/tools.py` | All agent tools including `get_enslaved_ancestors`, `get_enslavers_of_ancestors`, `hybrid_search`; `filter_people` with relationship labels; `filter_events` |
| `gramps_webapi/api/llm/deps.py` | `AgentDeps` dataclass: added `user_person_handle`, `user_person_gramps_id` fields |
| `gramps_webapi/api/tasks.py` | `process_chat()` separates `thought` and `response` fields; uses `sanitize_answer()` + `extract_thought_block()` pipeline |
| `gramps_webapi/api/lineage/` | **New directory**: Hybrid GraphRAG stack — `clients.py`, `intent_parser.py`, `retriever.py` (PARENT_OF Cypher, bilateral fix), `normalizer.py`, `vector_projector.py`, `graph_projector.py` (PARENT_OF edge creation), `projection_tasks.py` |
| `scripts/lineage_reindex.py` | Admin CLI for full reindex (Neo4j + Weaviate + SQLite) without HTTP API; auto-discovers tree dirname via `name.txt` scan |
| `gramps_webapi/api/util.py` | `get_db_manager()`: resolves human-readable tree name to dirname correctly (UUID vs name lookup) |
| `gramps_webapi/api/resources/schemas.py` | `TreeSchema`: added `system_prompt_ai` field |
| `gramps_webapi/api/resources/trees.py` | `TreeUpdateBodyArgs` + `PUT` handler wire `system_prompt_ai` to `set_tree_details()` |
| `gramps_webapi/api/media_importer.py` | **Bug fix (upstream candidate):** basename-fallback matching in `_fix_missing_checksums()` for GEDCOM imports with absolute host paths (FTM, legacy exporters); updates stored path in DB on basename match; fixes temp-dir leak on recursive call; adds structured logging to all failure paths |
| `gramps_webapi/api/media.py` | **Bug fix (upstream candidate):** `MediaHandlerLocal.upload_file()` falls back to basename instead of raising (and swallowed-silently) when absolute path is outside `base_dir` |
| `alembic_users/versions/9c3e7f1a2b5d_add_system_prompt_ai_to_trees.py` | Migration: adds `system_prompt_ai TEXT` to `trees` table |

**Frontend (`src/`):**

| File | Change |
|---|---|
| `src/components/GrampsjsChat.js` | Added `marked` import (GFM enabled); AI messages rendered with `marked.parse()` as `.content` property; reads separate `response` + `thought` API fields; falls back to `<thought>` tag parsing; word-by-word streaming animation |
| `src/components/GrampsjsChatMessage.js` | `content` property (pre-parsed HTML) rendered via `unsafeHTML` inside `.markdown-body`; `thought` property renders as native `<details>/<summary>` collapsible panel with CSS-only chevron rotation, gradient background, marked.parse() Markdown support |
| `src/views/GrampsjsViewChatSettings.js` | New view: AI Settings page — editable system prompt, draft auto-save, chat access control, Researcher Information section |
| `src/components/GrampsjsTabBar.js` | Added `ai: 'AI Settings'` settings tab (canManageUsers gate); removed standalone `researcher` tab and its `_permissionToSeeTab` case |
| `src/components/GrampsjsPages.js` | Mounts `grampsjs-view-chat-settings` (canManageUsers gate); removed `grampsjs-view-researcher` mount and import |
| `src/GrampsJs.js` | `/settings/researcher` → `/settings/ai` redirect via `replaceState` for backwards-compat |
| `src/views/GrampsjsViewResearcher.js` | **Orphaned** — file still on disk; no longer imported or mounted. Safe to delete in a future cleanup. |
| `package.json` | Added `marked ^17` dependency |

**Infra:**

| File | Change |
|---|---|
| `docker-compose.dev.yml` | Added AI Chat env vars, `env_file: .env`, and `lineage-search-index` volume |

### Media import — how it works after the fix

When a GEDCOM exported from **Family Tree Maker** (or any tool that embeds absolute machine paths) is imported:

1. Media objects are created with paths like `/Users/alice/Documents/FTM Media/photo.jpg` and empty checksums.
2. User uploads a ZIP of media files (flat or with a subdirectory).
3. The importer tries an **exact relative-path match** first (existing logic).
4. If that fails, it falls back to a **basename match** (`photo.jpg` → the one object whose stored path ends in `photo.jpg`). Match is skipped when ambiguous (two objects share the same basename — a warning is logged).
5. On a successful basename match the stored path in the DB is **updated to the ZIP-relative path** so the file lands at the right location and future imports need no further repair.
6. The file is uploaded to `MEDIA_BASE_DIR/<rel_zip_path>`.

Re-upload the ZIP after the fix is deployed — all previously failed objects will be linked correctly.

## Key Constraints

- **Correctness over polish**: Genealogical validity matters more than UI finish or conversational fluency.
- **Database verifies; model specializes**: The fine-tuned model teaches behavior and reasoning style — it is not the source of record. At runtime, the live DB is always truth.
- **Incremental**: Establish genealogy core → clean imports → validate sources → build extraction → build datasets → train → improve.
- **Local and private**: Fine-tuning data and trained models are intended for local deployment, not cloud hosting.
