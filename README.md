# Chilly Movies — Desktop Application

**A desktop-first, local-first offline movie and TV show downloader and player built with Electron, React, Node.js, and TypeScript.**

## 🎯 Project Vision

Chilly Movies provides reliable offline playback and local library management without cloud dependencies. Key principles:

- **Desktop-first**: Self-contained Electron application
- **Local-first**: All media and metadata stored on-device
- **Privacy-focused**: No telemetry by default, explicit opt-in only
- **Bilingual**: Full support for English and Swahili (Kiswahili)
- **Accessible**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18 LTS
- npm >= 9.0.0
- **TMDB API Key** (for metadata and movie search)

### Getting a TMDB API Key

1. Create a free account at [TMDB.org](https://www.themoviedb.org/signup)
2. Go to [API Settings](https://www.themoviedb.org/settings/api)
3. Request an API key (choose "Developer" option)
4. Copy your API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env and add your TMDB API key:
# TMDB_API_KEY=your_actual_api_key_here

# Start development environment (backend API + UI + Electron)
npm run dev
```

The development environment starts three processes:
1. **Backend API** on `http://localhost:3000`
2. **Vite dev server** on `http://localhost:5173`
3. **Electron** window loading the UI

### Build for Production

```bash
# Build all components
npm run build

# Package for current platform
npm run package

# Package for all platforms (Windows, macOS, Linux)
npm run package:all
```

## 📁 Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts             # Application lifecycle and window management
│   └── preload.ts          # Secure IPC bridge
├── renderer/               # React UI (renderer process)
│   ├── views/              # Application views
│   │   ├── DiscoveryView.tsx
│   │   ├── LibraryView.tsx
│   │   ├── DownloadsView.tsx
│   │   └── SettingsView.tsx
│   ├── App.tsx             # Main app component with navigation
│   ├── main.tsx            # React entry point
│   ├── i18n.ts             # Internationalization config
│   └── index.html          # HTML shell
├── api-server.ts           # Express backend API
├── downloader.ts           # Download engine interface
├── webtorrent-downloader.ts # WebTorrent implementation
├── storage.ts              # SQLite storage manager
├── metadata.ts             # TMDB metadata fetcher
└── retry.ts                # Retry with exponential backoff
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development environment (all processes) |
| `npm run dev:backend` | Start backend API only |
| `npm run dev:renderer` | Start Vite dev server only |
| `npm run dev:electron` | Start Electron only (requires backend + renderer) |
| `npm run build` | Build all components for production |
| `npm run build:backend` | Build backend TypeScript |
| `npm run build:main` | Build Electron main process |
| `npm run build:renderer` | Build React UI with Vite |
| `npm test` | Run test suite (Vitest) |
| `npm run package` | Package for current platform |
| `npm run package:all` | Package for all platforms |

## ⚙️ Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

### Required Variables

- **`TMDB_API_KEY`**: Your TMDB API key for metadata fetching (required)
  - Get it from: https://www.themoviedb.org/settings/api

### Optional Variables

- **`API_SECRET`**: Enable API authentication (leave empty for development)
- **`TMDB_BASE_URL`**: TMDB API base URL (default: https://api.themoviedb.org/3)
- **`DEFAULT_DOWNLOAD_PATH`**: Where to save downloads (default: ./media)
- **`MAX_CONCURRENT_DOWNLOADS`**: Max parallel downloads (default: 3)
- **`DEBUG`**: Enable debug logging (e.g., `chilly:*`)
- **`NODE_ENV`**: Environment mode (development/production)

**Note**: Never commit your `.env` file to version control. The `.gitignore` is already configured to exclude it.

## 🌐 Internationalization (i18n)

The app supports English and Swahili out of the box. Language preference is persisted locally.

**Switching language in UI**: Click the language toggle button (EN/SW) in the top navigation bar.

**Adding translations**: Edit `src/renderer/i18n.ts` and add keys to both `en` and `sw` resources.

## ♿ Accessibility

All UI components follow WCAG 2.1 AA standards:

- **Keyboard navigation**: All interactive elements accessible via Tab/Shift+Tab
- **ARIA labels**: Descriptive labels for screen readers
- **Focus indicators**: Visible focus outlines on all interactive elements
- **Color contrast**: Meets AA contrast ratios
- **Reduced motion**: Respects `prefers-reduced-motion` media query

**Accessibility testing**: Run `npm run dev` and check the browser console for axe-core violations (development mode only).

## 🔌 IPC Contract (Main ↔ Renderer Communication)

The renderer process communicates with the backend via a secure IPC bridge defined in `src/main/preload.ts`.

### Available APIs

```typescript
// Backend connection
window.electronAPI.getBackendPort(): Promise<number>

// Download management
window.electronAPI.download.start(job: DownloadJob): Promise<any>
window.electronAPI.download.pause(id: string): Promise<any>
window.electronAPI.download.resume(id: string): Promise<any>
window.electronAPI.download.cancel(id: string): Promise<any>
window.electronAPI.download.getStatus(id: string): Promise<any>

// Library management
window.electronAPI.library.getItems(): Promise<any[]>
window.electronAPI.library.getItem(id: string): Promise<any>

// App info
window.electronAPI.app.getVersion(): Promise<string>
window.electronAPI.app.getPath(name: string): Promise<string>
```

### Example Usage

```typescript
// Start a download
await window.electronAPI.download.start({
  id: 'unique-id',
  sourceType: 'torrent',
  sourceUrn: 'magnet:?xt=...',
  status: 'queued'
});

// Get library items
const items = await window.electronAPI.library.getItems();
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- tests/api-server.test.ts
```

**Test Coverage**:
- ✅ Backend API endpoints (authentication, rate limiting)
- ✅ Download engine (WebTorrent)
- ✅ Storage layer (SQLite + JSON fallback)
- ✅ Retry logic (exponential backoff)
- ⏳ UI components (to be added with React Testing Library)
- ⏳ E2E tests (to be added with Playwright)

## 📖 Backend API

See [README-backend.md](./README-backend.md) for detailed backend API documentation.

## 🔒 Security & Privacy

- **No cloud dependencies**: All data stored locally
- **No telemetry by default**: Explicit opt-in required for any data collection
- **Secure IPC**: Context isolation and sandboxing enabled
- **Content Security Policy**: Strict CSP in renderer process
- **API authentication**: Optional API key protection (set `API_SECRET` env var)

## 🛠️ Development Notes

### Hot Reload

In development mode, the renderer process supports hot module replacement (HMR) via Vite. Changes to React components will reload automatically.

### Debugging

- **Main process**: Use `console.log()` (output in terminal)
- **Renderer process**: Use browser DevTools (auto-opens in dev mode)
- **Backend API**: Use `DEBUG=chilly:*` environment variable for detailed logs

### Known Issues

- Integration tests are skipped by default (require network access)
- Better-sqlite3 may fail to build in some CI environments (JSON fallback provided)

## 📋 Roadmap

### Phase 1 (Current) — UI Foundation ✅
- [x] Electron shell with main/renderer processes
- [x] React UI with navigation (Discovery, Library, Downloads, Settings)
- [x] IPC contract for backend communication
- [x] i18n framework (English + Swahili)
- [x] Accessibility infrastructure (axe-core, ARIA labels)
- [x] Build and packaging configuration

### Phase 2 — Backend Integration
- [ ] Real TMDB API client (replace mock)
- [ ] YouTube downloader integration
- [ ] SSE (Server-Sent Events) for real-time download progress
- [ ] Video player component
- [ ] Subtitle management

### Phase 3 — Polish
- [ ] OS-level secure storage (Keychain/Credential Manager)
- [ ] Structured logging and opt-in telemetry
- [ ] E2E tests with Playwright
- [ ] Performance optimization
- [ ] Legal review and takedown mechanism

## 🤝 Contributing

See [specs/001-chilly-movies-a/](./specs/001-chilly-movies-a/) for full specifications, plan, and tasks.

Key documents:
- **spec.md**: Feature specification and requirements
- **plan.md**: Technical architecture and implementation plan
- **tasks.md**: Prioritized task breakdown
- **constitution.md**: Core principles and governance

## 📄 License

Private project. See repository owner for licensing details.

---

**Version**: 0.1.0  
**Last Updated**: 2025-10-16
