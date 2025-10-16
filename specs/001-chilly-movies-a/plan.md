# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Chilly Movies is a desktop/local-first application that provides reliable offline
playback and a local media library. Primary requirement: enable users to discover
metadata (TMDB), add content (YouTube or torrent), download and store media
locally, and play media fully offline. Technical approach (Phase 0 proposal): a
TypeScript-based Electron UI (React optional) talking to a local Node.js
backend that manages downloads (WebTorrent/aria2), a small local SQLite index
for metadata and search, and filesystem storage for large media assets.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (>=4.9) for application code; Node.js (>=18 LTS) for
backend processes; Electron (>=25) as the desktop shell. (ASSUMPTION: exact
minor versions to be locked during Phase 1)  
**Primary Dependencies**: Electron, React (optional UI), WebTorrent (or aria2 as
alternative), sqlite3 (local index), node-fetch/axios for TMDB, TMDB client
wrapper, Playwright for E2E testing, and a small i18n library (e.g., i18next).
**Storage**: Filesystem for media; SQLite (file-backed) for metadata index and
**Storage**: Filesystem for media; SQLite (file-backed) for metadata index and
search. Large binary assets remain on disk; indexes and preferences are local
and encrypted where sensitive. Sensitive credentials/API keys are stored in OS-level secure storage (Keychain, Credential Manager, libsecret) where available, with fallback to strong encrypted file if not. Target library size for design and benchmarks: Medium (1,000–10,000 items). (NEEDS CLARIFICATION: confirm SQLite vs. other indexing store).  
**Testing**: Unit tests via Vitest/Jest for business logic; Playwright for
UI/e2e; additional integration tests for download-resume and offline flows.
(NEEDS CLARIFICATION: preferred test runner and CI integration details).  
**Target Platform**: Desktop: Windows, macOS, Linux. Packaging via
electron-builder/electron-forge (to be decided in Phase 1).  
**Project Type**: Desktop application with a local backend process (Electron +
Node.js monorepo-style layout).  
**Performance Goals**: Meet measurable outcomes in the spec (SC-002): 95% of
playback sessions start within stated time bounds (5s SSD / 10s HDD) and app
keeps memory/disk usage reasonable for desktop-class machines.  
**Constraints**: Must operate fully offline once assets and metadata exist
locally; no mandatory cloud dependencies.  
**Scale/Scope**: Single-user, local-first desktop app; server-scale concerns are
out of scope.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature plan documents how Chilly Movies' desktop downloader/player maps to
the project constitution (`.specify/memory/constitution.md`). No principle is
being violated; the plan constrains implementation to meet the constitution.

Applicable principles and short rationale:

- I. Desktop-First, Local-First: Core feature — the app stores media,
  metadata, and preferences locally and must operate offline after assets are
  available. Implementation will default to local-first storage and local
  backend processes.
- II. Explicit Legal & Ethical Compliance: Discovery and optional torrent
  indexing must be opt-in; include a local takedown/reporting mechanism and
  UI disclaimers. DRM-protected content is out-of-scope by default.
- III. Modular, Extensible Architecture: Download engine, metadata provider,
  and player will be separated behind contracts/interfaces to allow replacements
  and tests.
- IV. Responsible Source Integration: TMDB is primary metadata source; torrent
  indexing is optional and requires explicit user opt-in and visible provenance
  information in the UI.
- V. Secure, Observable, and Testable Backend: Backend runs locally in Node and
  will include structured logging, local error reporting, and test harnesses.
- VI. User-First, Accessible, Bilingual UI: The plan includes i18n and
  accessibility checks as mandatory QA gates for UI PRs.
- VII. AI Assistance Is Assistive, Not Autonomous: Any AI features (e.g.,
  subtitle generation, metadata suggestions) will be opt-in, labeled, and
  reversible; no autonomous enforcement by models.

Deviations / tradeoffs: None proposed at this stage. Any deviation must be
documented and approved by at least two maintainers.

Required follow-ups before Phase 1 completion:

- Confirm exact runtime versions and lock Node/Electron/TypeScript minor
  versions (research task).
- Decide and validate local index technology (SQLite vs alternative) and
  provide migration plan if changed.
- Choose download engine strategy (WebTorrent vs aria2 wrapper) and define
  contract interface for pluggable downloaders.
- Legal review for built-in torrent indexing and takedown workflows (task).
- Define CI test runners and E2E test strategy (Playwright vs alternatives).
- Implement and validate secure credential storage using OS-level secure store APIs (Keychain, Credential Manager, libsecret) with fallback to strong encrypted file if unavailable. Add automated test to verify secrets are not accessible in plain text.
- Implement observability posture: local structured logs by default, optional opt-in telemetry export (pseudonymous, minimal), retention policy and privacy doc; ensure no telemetry by default in releases.
- Validate retry/backoff strategy for transient network and download failures (exponential backoff, 3 attempts) and ensure UI fallback and logging behavior are implemented and tested.
- Validate hybrid API-key strategy for discovery (app-managed key + caching) and provide UX for user-supplied API key for bulk syncs.

Plans that do not resolve the above follow-ups MUST keep those items in
`research.md` and return to the Constitution Check after Phase 1 design.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── main/                      # Electron main process
│   ├── main.ts               # App lifecycle, window management, IPC handlers
│   └── preload.ts            # Secure IPC bridge (contextBridge)
├── renderer/                 # React UI (renderer process)
│   ├── views/                # Application views
│   │   ├── DiscoveryView.tsx # TMDB search and discovery
│   │   ├── LibraryView.tsx   # Local media library
│   │   ├── DownloadsView.tsx # Active downloads with SSE progress
│   │   └── SettingsView.tsx  # User preferences and settings
│   ├── App.tsx               # Main app component with routing
│   ├── App.css               # Global styles
│   ├── main.tsx              # React entry point, axe-core integration
│   ├── i18n.ts               # i18next configuration (EN/SW)
│   ├── index.css             # Base styles
│   └── index.html            # HTML shell
├── api-server.ts             # Express backend API (download, metadata, SSE)
├── api-types.ts              # API request/response type definitions
├── downloader.ts             # Download engine interface
├── webtorrent-downloader.ts  # WebTorrent implementation
├── storage.ts                # SQLite/JSON storage manager
├── metadata.ts               # TMDB metadata fetcher
├── retry.ts                  # Exponential backoff retry utility
├── logger.ts                 # Structured logging
├── types.ts                  # Shared type definitions
└── index.ts                  # Public exports

tests/
├── api-server.test.ts        # Backend API endpoints
├── api-auth.test.ts          # API authentication
├── api-rate-limit.test.ts    # Rate limiting
├── downloader.test.ts        # Download engine interface
├── webtorrent.unit.test.ts   # WebTorrent driver unit tests
├── webtorrent.integration.test.ts # WebTorrent integration tests
├── storage.test.ts           # Storage layer tests
├── metadata.test.ts          # Metadata fetcher tests
├── retry.test.ts             # Retry logic tests
├── retry_behavior.test.ts    # Retry behavior validation
└── resume_cleanup.test.ts    # Resume data cleanup tests

contracts/
└── openapi.downloads.yaml    # API contract specification

docs/
└── TMDB_SETUP.md             # TMDB API key setup guide

specs/001-chilly-movies-a/    # Feature specification documents
├── spec.md                   # Feature specification
├── plan.md                   # This file
├── tasks.md                  # Task breakdown
├── research.md               # Phase 0 research decisions
├── data-model.md             # Entity definitions
├── quickstart.md             # Developer quickstart
├── checklists/
│   └── requirements.md       # Spec quality checklist
└── contracts/
    └── openapi.yaml          # Full API contract

Configuration Files:
├── package.json              # Dependencies, scripts, electron-builder config
├── tsconfig.json             # Base TypeScript config
├── tsconfig.build.json       # Backend build config
├── tsconfig.main.json        # Electron main process config
├── tsconfig.renderer.json    # React renderer config
├── vite.config.ts            # Vite bundler config
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore patterns
└── README.md                 # Project documentation
```

**Structure Decision**: Electron desktop application with three distinct layers:
1. **Main process** (`src/main/`): Electron lifecycle, window management, IPC bridge
2. **Renderer process** (`src/renderer/`): React-based UI with routing and views
3. **Backend process** (`src/*.ts`): Express API server, download engine, storage, metadata

All processes run locally. The main process starts the backend server on a random port and exposes it to the renderer via IPC. The renderer communicates with the backend through both REST endpoints and Server-Sent Events (SSE) for real-time updates.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
