Lineage Project Overview Onboarding Document

NOTE: This root folder needs to have Gramps Web forked from GitHub for any cases when it needs to be modified to support the Lineage project ONLY if the original Gramps Web does not support a Lineage key requirement. 

Lineage is a genealogy intelligence platform built to transform family history data into a living, source-aware, AI-assisted research system.

The project begins with traditional genealogy data such as GEDCOM exports and media files, but it is not limited to being a family-tree viewer. Lineage is intended to become a full genealogy dataset-building, analysis, and assistant platform that combines:
	•	canonical genealogy database management
	•	source and citation preservation
	•	media attachment and evidence review
	•	AI-assisted genealogy and genetic genealogy analysis
	•	dataset generation for domain-specific fine-tuning
	•	local model training and deployment for a specialized genealogy assistant

The purpose of Lineage is to create a system that can understand, explain, analyze, and assist with both documentary genealogy and genetic genealogy while remaining grounded in structured records and evidence.

⸻

Core Vision

Lineage is designed as a genetic genealogy intelligence stack.

It is intended to do three things at once:
	1.	Serve as the canonical genealogy database for family records, relationships, sources, citations, and media.
	2.	Generate high-quality structured datasets from genetic genealogy data for AI training and evaluation.
	3.	Power a specialized genealogy and genetic genealogy assistant that can reason carefully, detect contradictions, and communicate like a subject-matter expert.

The long-term goal is not simply to chat about a family tree. The long-term goal is to build an evidence-aware genealogy system that can:
	•	answer family-history questions conversationally
	•	explain how people are related
	•	identify contradictions in records
	•	handle uncertainty carefully
	•	speak the language of genealogy and genetic genealogy
	•	support research workflows instead of replacing them with guesswork

⸻

Strategic Foundation

Lineage will be built on top of a forked and rebranded genealogy core rather than a custom genealogy engine written from scratch.

The planned foundation is:
	•	Gramps Web for the web-based genealogy application layer (Lineage frontend)
	•	Gramps Web API for the backend that directly owns and manages the Lineage genealogy database (Lineage API)

The Lineage genealogy database is a Gramps-compatible family tree database managed directly by the Lineage API backend — the same data model used by Gramps Desktop. It is not a separate external system. The API reads and writes it directly, defaulting to SQLite with PostgreSQL also supported.

These projects provide the core genealogy model needed for:
	•	people
	•	families
	•	events
	•	places
	•	sources
	•	citations
	•	notes
	•	repositories
	•	media

This allows Lineage to focus development effort on:
	•	product design
	•	family-history workflows
	•	evidence-aware AI behavior
	•	dataset generation
	•	model fine-tuning and runtime integration

rather than rebuilding a genealogy database model from the ground up.

⸻

Project Intent

The intended build philosophy for Lineage is:

Use the database as truth. Use the model as a specialized analyst.

That means the genealogy database remains the authoritative system of record, while the AI system is trained to:
	•	speak genealogy and genetic genealogy fluently
	•	explain evidence and uncertainty clearly
	•	detect contradictions instead of hiding them
	•	produce structured review output when research issues are found
	•	provide a better user experience for exploring lineage data

This separation is deliberate.

The model is not intended to become the sole holder of family truth. It is intended to become a disciplined genealogy assistant operating on top of a canonical genealogy system.

⸻

Primary Components

1. Canonical Genealogy Layer

The canonical genealogy layer will be based on the Lineage fork of Gramps Web and Gramps Web API.

This layer will manage:
	•	family-tree records
	•	events and places
	•	source and citation structure
	•	notes and repositories
	•	linked media files
	•	record editing and validation
	•	relationship navigation

GEDCOM files and associated media will be imported into this layer, reviewed, and cleaned before being used for AI dataset generation.

2. Data Validation and Review Layer

Lineage is intended to preserve rigorous genealogy discipline.

The system will support review of:
	•	conflicting dates
	•	conflicting parentage
	•	ambiguous identity matches
	•	duplicate individuals
	•	unsupported claims
	•	source disagreements
	•	missing citations
	•	potential media linkage issues

This review layer is essential because genealogical validity matters more than conversational fluency.

3. Dataset Generation Layer

Lineage will include a dataset-building pipeline that transforms genealogy records into structured AI training data.

The intended flow is:

GEDCOM / imported genealogy data -> Lineage genealogy database (via Lineage API) -> normalized genealogy JSON -> JSONL training datasets

The generated datasets will support:
	•	genealogy chat fine-tuning
	•	genetic genealogy expertise training
	•	contradiction handling training
	•	uncertainty and evidence-aware answer training
	•	structured review and logging behavior

4. Fine-Tuning Layer

Lineage is intended to fine-tune a local specialist model for genealogy use.

The expected fine-tuning stack is:
	•	Unsloth Recipes for dataset shaping and refinement
	•	Apple MLX for local model fine-tuning on Apple Silicon
	•	Ollama for local model runtime and deployment

This stack is meant to make it possible to build a targeted genealogy assistant model locally, without depending on a permanent external hosted training workflow.

5. Runtime Assistant Layer

The final runtime model will be used as the Lineage assistant.

This assistant is intended to:
	•	chat about the family tree
	•	answer genealogy and genetic genealogy questions
	•	explain relationships and branch structure
	•	summarize individuals and families
	•	compare conflicting evidence
	•	recommend review actions
	•	defer to the live database when current truth is needed

⸻

AI Model Intent

The Lineage model is not meant to be a generic chatbot.

It is intended to be a genealogy and genetic genealogy subject-matter expert with disciplined, evidence-aware behavior.

The model should be trained to:
	•	speak the language of documentary genealogy
	•	speak the language of genetic genealogy
	•	integrate DNA reasoning with documentary reasoning
	•	handle uncertainty without overclaiming
	•	detect and report contradictions
	•	distinguish confirmed facts from hypotheses
	•	ask for clarification when identities are ambiguous
	•	produce consistent research-style output

The model should also be trained on locked-in, high-confidence identity anchors, starting with the project owner and selected immediate-family members whose core records are stable and well established.

At runtime, however, the live genealogy database remains the truth layer.

⸻

Fine-Tuning Scope

The Lineage fine-tuning dataset is intended to include:
	•	genealogy chat behavior
	•	relationship reasoning patterns
	•	person and family summary behavior
	•	source-aware answer style
	•	contradiction detection and contradiction reporting
	•	uncertainty handling
	•	structured review logging
	•	genetic genealogy terminology and reasoning patterns
	•	locked-in family anchor facts for stable, high-confidence close-family records
	•	family-specific branch names, aliases, locations, and naming patterns

The dataset is not intended to replace the live family tree.

Instead, it will teach the model:
	•	how to behave
	•	how to speak
	•	how to reason in-domain
	•	how to report issues
	•	how to operate with stable family context

⸻

Why a Fine-Tuned Model is Useful

A fine-tuned Lineage model should outperform a generic untuned model for Lineage-specific tasks because it will be taught:
	•	genealogy-specific language
	•	genetic genealogy analysis patterns
	•	family-specific context
	•	contradiction-handling behavior
	•	source-aware caution
	•	preferred review and logging structures

This allows a smaller targeted model to be practical for local use while the genealogy database provides the complete live evidence base.

In this architecture:
	•	the model specializes
	•	the database verifies
	•	the application coordinates

⸻

Planned User Experience

Lineage is intended to provide a cleaner and more modern genealogy experience than a standard genealogy web interface.

That includes potential rebranding and redesign of front-end experiences such as:
	•	dashboard design
	•	tree and profile views
	•	evidence views
	•	contradiction review views
	•	research workflows
	•	AI assistant interactions
	•	training and dataset management screens

The user experience should feel like a modern research and analysis platform, not only a legacy genealogy tool.

⸻

Intended Workflow

Phase 1: Ingest and Normalize
	•	export GEDCOM and media from genealogy tools
	•	import into the Lineage genealogy core
	•	verify people, families, sources, citations, and media links
	•	review and clean structural issues

Phase 2: Establish Canonical Truth
	•	use the Lineage database as the official source of record
	•	preserve source and citation integrity
	•	identify contradictions and unresolved questions
	•	lock in selected stable identity anchors

Phase 3: Build Datasets
	•	extract structured genealogy data from the canonical DB
	•	generate normalized JSON
	•	convert to JSONL training datasets
	•	shape datasets for genealogy and genetic genealogy behavior
	•	refine them through Unsloth Recipes

Phase 4: Fine-Tune the Model
	•	choose a practical local model target
	•	fine-tune the model using MLX
	•	test for genealogy behavior, contradiction handling, and family-context grounding
	•	package and deploy the model to Ollama

Phase 5: Operate the Assistant
	•	use the fine-tuned model as the Lineage assistant
	•	query the live database for runtime truth
	•	return grounded, cautious, high-quality genealogy answers
	•	support analysis, review, and research workflows

⸻

Initial Build Philosophy

Lineage should be built incrementally.

The intended order is:
	1.	establish the genealogy core
	2.	confirm clean imports and media handling
	3.	validate source and citation structure
	4.	build extraction and normalization tooling
	5.	build JSONL dataset generation
	6.	create the first fine-tuning dataset
	7.	train and test the first specialist model
	8.	improve UI, workflows, and assistant behavior over time

The project should prioritize correctness, structure, and maintainability before advanced polish.

⸻

Long-Term Direction

In the long term, Lineage is intended to become more than a family-tree interface.

It is intended to become a full genealogy intelligence environment that can support:
	•	family research
	•	lineage exploration
	•	contradiction review
	•	genetic genealogy analysis
	•	source-aware AI support
	•	domain-specific model training
	•	local private deployment

The project is intended to merge genealogy infrastructure, dataset engineering, and specialized AI into one system.

⸻

Summary

Lineage is a genealogy intelligence project built to turn structured family-history records into a living, AI-assisted genealogy platform.

It will use a forked genealogy core for canonical data management, a structured dataset pipeline for training data generation, and a fine-tuned local model for genealogy and genetic genealogy assistance.

The database will remain the truth layer.
The model will become the specialist analyst.
The application will unify both into a single research and assistant experience.

That is the intended design and use of Lineage.