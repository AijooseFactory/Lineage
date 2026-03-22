# Lineage &ndash; Frontend

**Lineage** is a genealogy intelligence platform built to transform family history data into a living, source-aware, AI-assisted research system. It goes beyond a family-tree viewer — Lineage is a full genealogy database, evidence review, and AI assistant platform.

## What is Lineage?

Lineage combines canonical genealogy database management with AI-assisted research workflows. It is built on a fork of [Gramps Web](https://github.com/gramps-project/gramps-web) and connects to the [Lineage API](https://github.com/AijooseFactory/Lineage-API) backend.

Key capabilities:

- **Canonical Genealogy Database** — Manage people, families, events, places, sources, citations, notes, repositories, and media in a structured, evidence-aware system.
- **Source & Citation Integrity** — Every claim is tied to its source. Unsupported assertions are surfaced, not hidden.
- **Data Validation & Review** — Identify conflicting dates, ambiguous identities, duplicate individuals, missing citations, and source disagreements.
- **Interactive Visualizations** — Family tree charts, dynamic maps, fan charts, and Y-DNA lineage views.
- **AI-Assisted Research** — A specialized genealogy and genetic genealogy assistant that reasons carefully, detects contradictions, and defers to the live database for truth.
- **Dataset Generation** — Pipeline for transforming canonical genealogy records into structured JSONL training datasets.
- **Local Model Fine-Tuning** — Train and deploy a specialist genealogy model locally via Apple MLX and Ollama.

## Architecture

```
Lineage (frontend)  ←→  Lineage API (backend)  ←→  Lineage genealogy database
                                                            ↓
                                              Dataset generation pipeline
                                                            ↓
                                              Fine-tuned local model (Ollama)
```

The Lineage genealogy database is a Gramps-compatible family tree database (SQLite by default, PostgreSQL supported) owned and managed directly by the Lineage API. The database is the truth layer. The AI model is the specialist analyst. The application coordinates both.

## Related

- **[Lineage API](https://github.com/AijooseFactory/Lineage-API)** — Python REST API backend
- **Upstream frontend**: [gramps-project/gramps-web](https://github.com/gramps-project/gramps-web)
- **Upstream backend**: [gramps-project/gramps-web-api](https://github.com/gramps-project/gramps-web-api)
