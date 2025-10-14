```markdown
<!--
	Sync Impact Report
	Version change: 1.0.0 -> 1.0.1
	Modified principles: none (content clarified and condensed)
	Added sections: Architecture Overview
	Removed sections: none
	Templates requiring updates: .specify/templates/plan-template.md ✅ reviewed
															.specify/templates/spec-template.md ✅ reviewed
															.specify/templates/tasks-template.md ✅ reviewed
	Follow-up TODOs: none
-->

# Chilly Movies Constitution

## Core Principles

### I. Desktop-First, Local-First (NON-NEGOTIABLE)
The application MUST operate as a self-contained desktop application (Electron shell) and provide a complete local-first experience: media, metadata, and user preferences are stored and usable on-device without mandatory cloud services. "Offline" in this constitution refers to desktop/local-first operation where internet access is optional for enhanced features.

Rationale: The project's core user value is reliable playback and library access on the user's device; cloud dependencies increase risk and harm the product promise.

### II. Explicit Legal & Ethical Compliance (NON-NEGOTIABLE)
Chilly Movies MUST respect copyright and takedown processes. The product MUST NOT attempt to circumvent DRM. The product MUST provide clear user-facing disclaimers, an in-app reporting mechanism for takedown requests, and tooling to disable flagged sources locally or via signed updates.

Rationale: Protects project from legal exposure and ensures ethical operation. This principle is a hard constraint for design and UX decisions.

### III. Modular, Extensible Architecture (MUST)
All features MUST be modular and independently replaceable. Each major capability (discovery, download engine, player UI, metadata store, AI helpers) MUST expose a well-defined contract so implementations can be swapped or upgraded with minimal cross-cutting changes.

Rationale: Enables maintenance, iterative replacement of implementations, and optional third-party integrations without large-scale rewrites.

### IV. Responsible Source Integration (SHOULD)
The product SHOULD prefer metadata-first discovery (TMDB) and treat torrent search/indexing as an optional, explicit, opt-in capability with clear legal guidance. Sources must be verified, and the app must surface provenance (where a source came from).

Rationale: Balances user convenience with risk mitigation and transparency.

### V. Secure, Observable, and Testable Backend (MUST)
Backend processes responsible for downloads, metadata ingestion, and any privileged operations MUST run securely on-device (Node.js). They MUST support structured logging, error reporting (local), and test harnesses for unit and integration tests. Sensitive data (API keys, credentials) MUST be stored encrypted and only with explicit user consent for any cloud use.

Rationale: Ensures maintainability, debuggability, and user privacy while enabling reliable offline behavior.

### VI. User-First, Accessible, Bilingual UI (MUST)
The UI MUST be modern, cinematic, responsive, and accessible. It MUST provide bilingual support (Swahili and English) with a persisted language preference and must minimize jargon. Accessibility targets (e.g., WCAG AA where feasible) SHOULD be met and documented in design acceptance criteria.

Rationale: Accessibility and localization are fundamental to product reach and usability.

### VII. AI Assistance Is Assistive, Not Autonomous (MUST)
AI features (search summarization, subtitle generation, recommendations) MUST be opt-in and clearly labeled. Generated content MUST be attributed and editable by users. AI modules are assistive: they can suggest corrections, metadata enhancements, and UX improvements, but MUST NOT perform autonomous enforcement or irreversible decisions (for example, auto-deleting content or automatically disabling sources). Any model use that sends data off-device requires explicit opt-in and clear privacy documentation.

Rationale: Preserve user control and privacy; prevent accidental data exfiltration. Make AI outputs auditable and reversible.

## Architecture Overview

Chilly Movies follows a desktop application architecture:

- Frontend: Electron (Chromium) host with a UI layer (TypeScript + optional React/ShadCN components). The UI is responsible for rendering, user interactions, and localization.
- Backend: Node.js processes run locally to manage downloads (torrent/WebTorrent or aria2), metadata fetch (TMDB), and media I/O. Communication between UI and backend uses secure IPC channels provided by Electron (no external servers needed for core flows).
- Data: Media files, subtitles, and metadata are stored on the user's filesystem; indexes and preferences are stored locally (encrypted when sensitive).

Interaction: The UI issues requests to the local backend via IPC. The backend performs downloads, writes files to disk, updates the local index, and notifies the UI of progress. All core operations function without network connectivity once assets and metadata exist locally.

## Security & Privacy Constraints
1. No telemetry or user data leaves the device by default. Any telemetry MUST be explicit opt-in with clear scope and retention policy documented in-app.
2. API keys or credentials stored locally MUST be encrypted at rest and protected by OS-level secure storage where available.
3. DRM-protected content is not supported by default; the product MAY integrate platform DRM only via explicit design and legal review.

## Development Workflow & Quality Gates
1. Test-first for critical modules: downloads, playback, metadata sync, and legal-handling flows. Unit tests + integration tests MUST be added before merging major features.
2. Every feature plan MUST include a "Constitution Check" section that references relevant principles and documents how the feature satisfies them.
3. Accessibility and localization checks MUST be part of the QA checklist for UI PRs.

## Governance
Amendments to this constitution require a documented proposal, review by at least two maintainers, and a recorded migration plan if the change affects behavior or data format. Minor clarifications (typos, wording) may be applied as PATCH. Adding new principles or removing existing ones is a MINOR or MAJOR bump respectively and requires consensus.

**Version**: 1.0.1 | **Ratified**: 2025-10-13 | **Last Amended**: 2025-10-14
```