````markdown
```markdown
# Phase 0 — Research & Decisions

This document records decisions and research tasks that resolve the
NEEDS_CLARIFICATION markers in the feature specification and the implementation
plan. Each decision includes rationale and alternatives considered. Remaining
open tasks are listed at the end (action items).

## Resolved Decisions

6. Decision: Secure credential storage — OS-level secure storage (Keychain/Credential Manager/libsecret) where available; fallback to strong encrypted file if not.

- Rationale: OS-provided secure stores are best practice for desktop apps, providing strong, user-auditable protection and integration with platform security. Fallback encryption ensures coverage on platforms lacking a secure store.
- Alternatives considered: App-managed encrypted file (risk of weak key management), no persistent storage (poor UX), or storing in plain text (unacceptable risk).

1. Decision: Local index store — SQLite (file-backed)

- Rationale: SQLite is lightweight, widely supported in Node.js via `better-sqlite3`
  or `sqlite3`, performs well for desktop workloads, requires no separate
  server process, and supports full-text search via FTS modules if needed.
- Alternatives considered: LevelDB/LMDB (fast but less SQL-friendly),
  embedded Elastic-like stores (too heavy), or custom JSON indexes (fragile
  for larger datasets). SQLite offers maturity and migration tooling.

2. Decision: Primary download engine interface + reference implementation

- Rationale: Provide a pluggable `Downloader` interface and ship two drivers:
  - `webtorrent-driver` using WebTorrent for native magnet/peer downloads
  - `aria2-driver` that proxies aria2 RPC for environments preferring aria2

- Alternatives considered: single-engine approach (locks decisions), or using
  a heavier native client. Pluggable drivers balance usability and replaceability.

3. Decision: Test runner & E2E: Playwright + Vitest (unit)

- Rationale: Playwright provides reliable cross-platform E2E testing for
  Electron apps; Vitest (or Jest) is a fast TypeScript-friendly unit test
  runner. This combination supports the quality gates required in the
  constitution (accessibility, i18n checks).  
- Alternatives considered: Cypress (less native Electron support), Jest only
  (no cross-platform E2E).  

4. Decision: Version pinning policy (Phase 1)

- Rationale: Lock minor versions for Electron, Node.js, and TypeScript in the
  `package.json` and provide an `engines` field for Node. Exact pins to be
  chosen during Phase 1 after compatibility tests.

5. Decision: Legal review and takedown handling

- Rationale: Built-in torrent indexing is optional and must be explicit opt-in
  with in-app guidance. A legal review task is required to confirm region
  restrictions and takedown procedures. The app will implement a local
  reporting mechanism and support signed takedown lists via optional updates.

## Open Research Tasks (Action Items)

7. TASK-R7: Implement and validate secure credential storage using OS-level secure store APIs (Keychain, Credential Manager, libsecret). Provide fallback to strong encrypted file if unavailable. Add automated test to verify secrets are not accessible in plain text. (Owner: eng; Est: 2 days)
 
8. TASK-R8: Implement observability posture: local structured logs by default and an opt-in telemetry exporter (pseudonymous, minimal). Define retention policy and privacy documentation; add tests that verify no telemetry is sent by default. (Owner: eng; Est: 2 days)

9. TASK-R9: Validate retry and backoff behavior for transient network and download errors. Produce a small test harness that simulates transient failures and verifies exponential backoff (3 attempts), UI states, and structured logs include retry events. (Owner: eng; Est: 1 day)

10. TASK-R10: Validate hybrid API-key strategy and caching: measure typical discovery workloads using app-managed key under rate limits, implement client-side caching/TTL, and define UX for requesting a user-supplied API key for bulk syncs. (Owner: eng; Est: 2 days)

1. TASK-R1: Validate SQLite FTS performance with expected local library sizes
  (target: 1,000–1,000,000 items). Run a microbenchmark against `better-sqlite3`
  and measure indexing and query latencies across the medium range; add
  sample dataset and performance thresholds. (Owner: eng; Est: 1 day)

2. TASK-R2: Implement small prototype of `Downloader` interface and test both
   WebTorrent and aria2 drivers for pause/resume, disk write patterns, and
   cross-platform behavior. (Owner: eng; Est: 3 days)

3. TASK-R3: CI test matrix: verify Playwright-based E2E runs in CI for Linux,
   macOS, and Windows runners (or use build matrix emulation). (Owner: eng; Est:
   2 days)

4. TASK-R4: Legal review checklist and region guidance for optional torrent
   indexing; draft in-app language for opt-in flows and UI disclaimers. (Owner:
   legal/eng; Est: 2–4 days)

5. TASK-R5: Decide packaging tool (electron-builder vs electron-forge) and
   produce packaging checklist per-platform. (Owner: eng; Est: 2 days)

6. TASK-R6: Define migration plan if index store changes (e.g., SQLite → another
   format). Add simple export/import tooling for library metadata. (Owner: eng; Est: 2 days)

## Consolidated Findings (short)

- Chilly Movies is best served by an Electron + Node.js local architecture
  with TypeScript across both layers.
- SQLite provides a pragmatic, testable local index with minimal ops burden.
- Download engine must be pluggable; provide WebTorrent by default and aria2 as
  an alternative driver.
- Testing strategy: Vitest for unit tests + Playwright for E2E across
  platforms.

## Next Steps

1. Complete TASK-R1..TASK-R6 during Phase 0. Move any unresolved items into
   the Phase 1 backlog if research is blocked.
2. After research tasks complete, produce `data-model.md`, `contracts/`, and
   `quickstart.md` in Phase 1.

```
````
