````markdown
```markdown
# Quickstart — Chilly Movies (developer)

Prerequisites: Node.js >=18, pnpm or npm, Git

1. Install dependencies

   npm install

2. Start the local backend and Electron UI in dev mode

   npm run dev

3. Run unit tests

   npm test

4. Run E2E (Playwright) tests

   npx playwright test

Notes:

- The local API (for contracts) runs on a dynamic dev port; the OpenAPI
  skeleton in `contracts/openapi.yaml` shows the surface area expected by the
  UI.
- For download engine testing, run the aria2 driver locally or use the
  WebTorrent test harness.

```
````
