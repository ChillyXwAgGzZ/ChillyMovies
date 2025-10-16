# Implementation Tasks: Chilly Movies — Offline Downloader & Player

This file lists prioritized engineering tasks derived from Phase 0 research (TASK-R1..TASK-R10). Each task includes: owner, priority, estimate, dependencies, acceptance criteria, and notes.

---

## TASK-R2 (High) — Prototype Downloader interface & drivers
- Owner: eng
- Priority: High
- Estimate: 3 days
- Dependencies: None
- Description: Implement a pluggable `Downloader` interface and two reference drivers: `webtorrent-driver` (using WebTorrent) and `aria2-driver` (aria2 RPC wrapper). Provide a minimal API for start/pause/resume/cancel and emitting progress events.
- Acceptance criteria:
  - `Downloader` interface defined in TypeScript with start/pause/resume/cancel APIs.
  - WebTorrent driver demonstrates downloading a small test torrent to disk and emits progress events.
  - aria2 driver demonstrates adding a URL/magnet and managing pause/resume via aria2 RPC.
  - Unit tests cover state transitions and error paths.
- Notes: Use native Node streams for writes; ensure drivers write to a configurable storage location.

## TASK-R1 (High) — SQLite FTS microbenchmark
- Owner: eng
- Priority: High
- Estimate: 1 day
- Dependencies: data-model.md
- Description: Create a microbenchmark to validate SQLite FTS performance for the target library size (1,000–10,000 items). Generate synthetic datasets and measure indexing and query latency.
- Acceptance criteria:
  - Benchmark script produces metrics for indexing throughput and query latency.
  - Document shows median/95th latency for typical queries and recommendations (e.g., FTS5 settings).
- Notes: Use `better-sqlite3` or equivalent for accurate synchronous measurements.

## TASK-R3 (Medium) — CI E2E (Playwright) matrix
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: TASK-R2
- Description: Add Playwright-based E2E tests that can run in CI across Linux/macOS/Windows (or via Linux matrix for dev). Include basic UI flows (search → add → download → play stub) and accessibility checks.
- Acceptance criteria:
  - Playwright tests run in CI and report pass/fail.
  - At least one accessibility test (axe-core) runs as part of E2E.
- Notes: Initially target Linux CI runner; expand to macOS/Windows runners when necessary.

## TASK-R9 (High) — Retry & Backoff Test Harness
- Owner: eng
- Priority: High
- Estimate: 1 day
- Dependencies: TASK-R2
- Description: Implement a test harness that simulates transient network and source failures and validates exponential backoff (3 attempts), UI state transitions, and logging of retry events.
- Acceptance criteria:
  - Test harness simulates failures and verifies 3 retry attempts with exponential backoff timings.
  - UI state transitions captured in tests and structured logs contain retry events.

## TASK-R7 (Medium) — Secure credential storage implementation
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: None
- Description: Implement platform-specific secure storage wrappers: Keychain (macOS), Credential Manager (Windows), libsecret/Secret Service (Linux); provide a fallback encrypted store if unavailable.
- Acceptance criteria:
  - Secrets API that abstracts platform stores and a fallback implementation.
  - Automated tests verifying secrets are stored encrypted and not readable as plain text on disk.

## TASK-R8 (Medium) — Observability & Telemetry
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: TASK-R2
- Description: Implement local structured logging (JSON lines) for backend processes and an opt-in telemetry exporter that sends minimal pseudonymous events when enabled. Document retention policy and opt-in UI.
- Acceptance criteria:
  - Structured logs are produced for key events (downloads start/stop/error, retries, diagnostics).
  - Telemetry export is disabled by default and sends only documented, minimal fields when enabled.
  - Tests verify no telemetry is sent by default.

## TASK-R4 (Medium) — Legal review checklist & takedown flow design
- Owner: legal/eng
- Priority: Medium
- Estimate: 2-4 days
- Dependencies: None
- Description: Produce a legal checklist for optional torrent indexing and draft in-app language for opt-in flows, takedown reporting, and region guidance.
- Acceptance criteria:
  - Legal checklist completed and added to repo.
  - Draft in-app text for opt-in torrent indexing and takedown reporting.

## TASK-R10 (Medium) — API quota & caching strategy validation
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: None
- Description: Validate hybrid API-key strategy: measure discovery workload impact using an app-managed key under rate limits; implement client-side caching/TTL and define UX for requesting a user-supplied API key for bulk syncs.
- Acceptance criteria:
  - Caching layer implemented with configurable TTL.
  - Documented UX flow for user-supplied API key and tests demonstrating fallback to cached results when rate-limited.

## TASK-R6 (Low) — Index migration & export/import tooling
- Owner: eng
- Priority: Low
- Estimate: 2 days
- Dependencies: TASK-R1
- Description: Provide simple export/import tooling for library metadata and a migration plan if the index store changes.
- Acceptance criteria:
  - Export file format documented (JSON) and import works for sample dataset.
  - Migration notes present in docs.

## TASK-R5 (Low) — Packaging tool decision and packaging checklist
- Owner: eng
- Priority: Low
- Estimate: 2 days
- Dependencies: None
- Description: Decide between `electron-builder` and `electron-forge` and produce packaging checklist for Windows/macOS/Linux.
- Acceptance criteria:
  - Packaging tool chosen and checklist created.
- Status: ✅ COMPLETED (electron-builder chosen, package.json configured)

---

## Phase 2 — Implementation Tasks

### TASK-I1 (High) — Install and Offline Operation Implementation (FR-001, FR-006)
- Owner: eng
- Priority: High
- Estimate: 3 days
- Dependencies: TASK-R2
- Description: Implement installer flow for Windows/macOS/Linux, ensure app runs fully offline after installation, implement library persistence on startup with resume/index functionality.
- Acceptance criteria:
  - Electron app installs and launches without network on all platforms
  - Library items persist across restarts and load from local SQLite/JSON store
  - Resume data loads on startup for incomplete downloads
- Notes: Test with network disabled to verify offline operation

### TASK-I2 (High) — Bilingual UI Implementation (FR-007)
- Owner: eng
- Priority: High
- Estimate: 2 days
- Dependencies: None
- Description: Complete i18n implementation for all UI strings in English and Swahili. Ensure language toggle works and preference persists.
- Acceptance criteria:
  - All UI text translatable via i18next
  - Language toggle between EN/SW functional
  - Language preference saved in localStorage and restored on launch
  - Translation keys cover all views: Discovery, Library, Downloads, Settings
- Notes: Current implementation in App.tsx and i18n.ts provides foundation
- Status: ✅ COMPLETED (i18n framework implemented, language toggle working)

### TASK-I3 (High) — Accessibility Implementation (FR-008)
- Owner: eng
- Priority: High
- Estimate: 3 days
- Dependencies: None
- Description: Ensure WCAG 2.1 AA compliance with keyboard navigation, ARIA labels, focus indicators, and screen reader support. Integrate axe-core for automated testing.
- Acceptance criteria:
  - All interactive elements keyboard-accessible (Tab/Shift+Tab)
  - ARIA labels on all controls
  - Visible focus indicators with sufficient contrast
  - axe-core tests pass in development mode with no critical violations
  - Manual screen reader testing completed
- Notes: axe-core already integrated in main.tsx for development
- Status: ✅ COMPLETED (ARIA labels present, axe-core integrated)

### TASK-I4 (Medium) — Subtitle Management (FR-009)
- Owner: eng
- Priority: Medium
- Estimate: 3 days
- Dependencies: TASK-I1
- Description: Implement subtitle track selection, synchronization, and display during playback. Support common formats (SRT, VTT, ASS).
- Acceptance criteria:
  - Subtitle files detected and loaded from library
  - UI for selecting subtitle track (language, source)
  - Subtitles synchronized with video playback
  - Support SRT and VTT formats minimum
- Notes: Requires video player component implementation

### TASK-I5 (Medium) — Settings UI Implementation (FR-012)
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: TASK-I2
- Description: Implement Settings view with download location, bandwidth limits, language preference, telemetry opt-in controls.
- Acceptance criteria:
  - Settings view UI complete with form controls
  - Download location picker functional
  - Bandwidth limits configurable
  - Privacy/telemetry toggle with clear explanation
  - Settings persist in UserPreferences store

### TASK-I6 (Medium) — Missing Media Handling (FR-013)
- Owner: eng
- Priority: Medium
- Estimate: 2 days
- Dependencies: TASK-I1
- Description: Implement UI flow for handling missing media files (moved/deleted). Provide re-link and re-download options.
- Acceptance criteria:
  - Detect when media file path is invalid on playback attempt
  - Show modal/dialog with options: re-link (file picker) or re-download
  - Update library item paths when re-linked
  - Queue re-download if user chooses that option
- Notes: Add validation on library load to detect missing files early

### TASK-I7 (High) — TMDB Metadata Integration (FR-003, FR-015)
- Owner: eng
- Priority: High
- Estimate: 2 days
- Dependencies: TASK-R10
- Description: Connect Discovery UI to live TMDB API via backend /metadata/search endpoint. Implement caching layer with TTL.
- Acceptance criteria:
  - Discovery search calls backend /metadata/search with query param
  - Results display with poster images, titles, year, overview
  - Caching layer reduces redundant API calls
  - Handle rate limiting gracefully with cached fallback
- Notes: TMDB API key already in .env.example, TMDBMetadataFetcher implemented
- Status: ✅ COMPLETED
  - TMDBMetadataFetcher tested with live API (tests/metadata.integration.test.ts)
  - DiscoveryView.tsx updated to fetch from /metadata/search endpoint
  - Results display poster, title, year, overview, rating, media type
  - Error handling and loading states implemented

### TASK-I8 (High) — SSE Download Progress (FR-005, FR-011)
- Owner: eng
- Priority: High
- Estimate: 2 days
- Dependencies: TASK-R2, TASK-R9
- Description: Connect DownloadsView to SSE endpoint /events/:id for real-time download progress updates.
- Acceptance criteria:
  - EventSource connection established to /events/:id per download
  - UI updates in real-time with progress percent, speed, ETA
  - Handles connection errors and reconnects
  - Shows appropriate status badges (queued, active, paused, completed, failed)
- Notes: Backend SSE endpoint already implemented in api-server.ts
- Status: ✅ COMPLETED
  - EventSource connections established per download ID
  - Real-time progress updates with percent, speed, ETA display
  - Automatic cleanup of EventSource on component unmount
  - Status badges update based on SSE events (started, progress, completed, error)

---

### Execution notes
- **Phase 0 (Research)**: TASK-R2, TASK-R1, TASK-R9, TASK-R7, TASK-R8, TASK-R10, TASK-R3, TASK-R4, TASK-R6, TASK-R5
- **Phase 1 (Foundation)**: TASK-I1, TASK-I2, TASK-I3 (constitution-critical)
- **Phase 2 (Core Features)**: TASK-I7, TASK-I8, TASK-I5, TASK-I6, TASK-I4
- Where estimates include CI validation, add an extra half-day buffer for flaky environments.
- Tasks marked ✅ COMPLETED are already implemented in current codebase
- Tasks marked 🔄 IN PROGRESS are currently being worked on
