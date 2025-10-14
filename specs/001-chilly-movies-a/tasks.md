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

---

### Execution notes
- Recommended ordering: TASK-R2, TASK-R1, TASK-R9, TASK-R7, TASK-R8, TASK-R10, TASK-R3, TASK-R4, TASK-R6, TASK-R5.
- Where estimates include CI validation, add an extra half-day buffer for flaky environments.
- I can also create stub implementations and CI job templates for TASK-R2/TASK-R3 if you want.
