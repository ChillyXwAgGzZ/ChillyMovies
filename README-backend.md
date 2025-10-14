# Chilly Movies — Backend

This folder contains a minimal TypeScript backend scaffold for the Chilly
Movies project. It's designed to be UI-agnostic and used by an Electron UI or
other frontends.

## Quick start

1. Install dependencies

   ```bash
   npm install
   ```

2. Run unit tests

   ```bash
   npm test
   ```

3. (Optional) Run integration tests
   ```bash
   # Requires network access; skipped by default
   npm run test:integration
   ```

## What's included

- `src/downloader.ts` — Base `Downloader` interface and mock driver
- `src/webtorrent-downloader.ts` — WebTorrent-based downloader implementation
- `src/metadata.ts` — MetadataFetcher interface and mock implementation
- `src/storage.ts` — Simple SQLite-backed storage manager
- `src/retry.ts` — Retry helper using exponential backoff
- `tests/` — Unit tests and integration tests

## Using the WebTorrent downloader

```typescript
import { WebTorrentDownloader } from "./webtorrent-downloader";

const downloader = new WebTorrentDownloader({
  mediaRoot: "/path/to/downloads" // optional, defaults to ./media
});

// Listen for events
downloader.on("started", (job) => console.log("Started:", job));
downloader.on("progress", (job) => console.log("Progress:", job.progress));
downloader.on("completed", (job) => console.log("Completed:", job));
downloader.on("error", (err, job) => console.error("Error:", err));

// Start a download
await downloader.start({
  id: "unique-id",
  sourceType: "torrent",
  sourceUrn: "magnet:?xt=...",
  status: "queued"
});

// Pause/resume
await downloader.pause("unique-id");
await downloader.resume("unique-id");

// Cancel and cleanup
await downloader.cancel("unique-id");
```

## Testing notes

- Unit tests use a mock WebTorrent client for predictable behavior
- Integration tests require network access and are skipped by default
- Use `npm run test:integration` to run network-dependent tests

## Privacy & local-first principles

- No telemetry or external data collection
- All downloads stored locally in configurable path
- No external dependencies beyond torrent transfer

## HTTP API layer

This repository exposes a thin HTTP API layer that wraps the backend downloader
so UIs (Electron, web, CLI) can use the same backend.

Available endpoints (see `contracts/openapi.downloads.yaml`):

- POST `/download/start` — body: `{ id, sourceType, sourceUrn }`
- POST `/download/pause` — body: `{ id }`
- POST `/download/resume` — body: `{ id }`
- GET `/download/status/:id` — returns `{ id, status, progress }`
- POST `/download/cancel` — body: `{ id }`

Example using fetch (frontend):

```js
await fetch("http://localhost:3000/download/start", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ id: "1", sourceType: "torrent", sourceUrn: "magnet:..." })
});
```

The API is intentionally thin — all business logic remains in the backend
modules. The server is implemented in `src/api-server.ts` and can be started by
importing `createServer()` and listening on a port.

OpenAPI/Swagger spec is in `contracts/openapi.downloads.yaml` for generating
client stubs or interactive docs.
