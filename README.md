# CareerMaker

CareerMaker is an AI research development and publication-intelligence platform. Its purpose is to help researchers produce work worth publishing—not simply make weak writing sound polished.

## Current experience

The anonymous, free prototype supports:

- Manuscript upload and paste input
- Browser-side text extraction for supported readable formats
- Manuscript score with weighted research dimensions
- Blunt verdict and detailed evaluation
- AI-writing diagnostic with limitations
- Research-integrity review checklist
- Peer-review simulation preview
- Editor decision and prioritized revision plan
- Research idea evaluator
- Journal, conference, and submission-formatter foundations
- Paper health dashboard and research workspace preview
- Local report download
- Session-only dark mode

No sign-in, cloud storage, manuscript history, or billing is active.

## Product principles

- Evidence over reassurance.
- No fabricated sources, citations, statistics, or publication guarantees.
- Formatting must not silently rewrite substantive scholarship.
- AI-writing analysis is probabilistic and must never be presented as proof of authorship.
- A manuscript-only review audits reported methods and internal consistency; it cannot verify that an analysis was executed correctly.
- Unpublished research remains private in the current anonymous experience.

## Production architecture

The intended next implementation uses a TypeScript web application with:

1. An upload and parsing service for DOCX, PDF, TXT, Markdown, and RTF.
2. A provider-neutral AI interface with structured JSON schemas and validation.
3. A staged evaluation pipeline: classification → contribution → theory → literature → methods → analysis → results → writing → integrity → synthesis.
4. Separate reviewer simulations and editor-decision synthesis.
5. Official-source retrieval for journals, conferences, and formatting requirements.
6. Content-preservation verification for formatted outputs.
7. Optional persistence only after the anonymous experience is trustworthy.

Required external infrastructure for production includes an AI provider key, document parsing libraries or service, secure file scanning, official scholarly metadata sources, and a deployment runtime. None of those integrations are claimed to be active in this prototype.

## Local preview

The current static site can be served from this directory with any local static server. It has no server-side processing and does not send manuscript text to a provider.

## Roadmap

### Phase 1 — Manuscript evaluation

Replace heuristic evaluation with server-side structured AI analysis, reliable PDF/DOCX extraction, staged progress, validation, retries, and full downloadable reports.

### Phase 2 — Scholarly integrity

Add citation parsing, DOI and metadata verification, claim-source checks, retraction/correction checks, and reference-library foundations.

### Phase 3 — Publication intelligence

Connect official journal and conference sources, target tiers, source dates, confidence labels, journal-fit comparison, and formatting-rule extraction.

### Phase 4 — Research workspace

Add opt-in accounts, encrypted storage, versions, reviewer-response tracking, collaborators, portfolio views, research streams, and career intelligence.

### Phase 5 — Product hardening

Add accessibility QA, rate limits, malware scanning, deletion controls, provider monitoring, automated tests, billing readiness, and deployment.

## Honest status

This repository is a functioning product prototype, not a production-ready AI platform. External AI, scholarly search, persistent storage, authentication, billing, and authoritative document generation remain to be implemented and tested.
