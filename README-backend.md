# Chilly Movies — Backend

This folder contains a minimal TypeScript backend scaffold for the Chilly
Movies project. It's designed to be UI-agnostic and used by an Electron UI or
other frontends.

## Quick start

````markdown
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

## Authentication Testing

The server supports an optional API key to protect sensitive endpoints. Set
`API_SECRET` to enable authentication. When set, clients must send the key via
the `x-api-key` header or `api_key` query parameter.

Quick test examples:

```bash
# allow-list mode off (public):
unset API_SECRET
npm test # all API routes should respond 200 in tests

# enable API key:
export API_SECRET=supersecret
# header:
curl -X POST -H "x-api-key: supersecret" -d '{"id":"1"}' \
   -H "Content-Type: application/json" http://localhost:3000/download/start

# query param:
curl -X POST "http://localhost:3000/download/start?api_key=supersecret" \
   -H "Content-Type: application/json" -d '{"id":"1"}'
```

## Rate Limit Testing

The server applies rate limiting to protect expensive operations. In tests we
use short windows so the behavior can be validated quickly; production defaults
are larger. You can test rate limiting locally by running rapid requests or by
starting the server with a custom limiter (see `src/api-server.ts`). Example:

```bash
# send 4 quick requests — with a test limiter of max=3 the 4th will return 429
for i in 1 2 3 4; do \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' \
    -d '{"id":"'$i'"}' http://localhost:3000/download/start; \
done
```

````

