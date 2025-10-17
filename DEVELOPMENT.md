# Development Guide - Chilly Movies

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18 LTS
- npm >= 9.0.0
- TMDB API Key (already configured in `.env`)

### Starting the Development Environment

```bash
npm run dev
```

This command starts three processes concurrently:
1. **Backend API** (`tsx src/server.ts`) → http://localhost:3000
2. **Vite Dev Server** → http://localhost:5173
3. **Electron Window** → Loads from Vite dev server

### Individual Process Commands

```bash
# Start only the backend API
npm run dev:backend

# Start only the Vite dev server
npm run dev:renderer

# Start only Electron (requires backend + renderer running)
npm run dev:electron
```

## 🔧 What Was Fixed

### Issue: `npm run dev` was failing with "Unknown file extension .ts"

**Root Cause:**
- The `dev:backend` script was trying to run `src/index.ts` which is just a library export file, not a server
- Using `ts-node-esm` which has issues with TypeScript ESM modules

**Solution:**
1. ✅ Created `src/server.ts` - dedicated backend server entry point
2. ✅ Installed `tsx` - modern TypeScript runner with better ESM support
3. ✅ Updated `dev:backend` script to use `tsx src/server.ts`
4. ✅ Fixed Electron main process to use existing dev backend (port 3000) instead of starting its own
5. ✅ Updated Content Security Policy in `index.html` to allow:
   - Backend API calls to `localhost:3000`
   - TMDB images from `https://image.tmdb.org`
   - TMDB API calls from `https://api.themoviedb.org`

## 🧪 Testing the Implementation

### 1. Test Backend API

```bash
# In a separate terminal while npm run dev is running:
curl "http://localhost:3000/metadata/search?q=Inception"
```

Expected response: JSON with movie results including "Inception" (2010)

### 2. Test Frontend UI

The Electron window should open automatically and show:
- **Discovery View** (default): Search bar for movies/TV shows
- **Library View**: Empty state (no downloads yet)
- **Downloads View**: Empty state (no active downloads)
- **Settings View**: Coming soon

### 3. Test Discovery Search

1. In the Electron window, type "Inception" in the search bar
2. Click "Search" button
3. You should see movie results with:
   - Poster images
   - Movie titles
   - Release years
   - Ratings (⭐ X.X/10)
   - Movie/TV Show badges
   - Overview text (truncated to 150 chars)
   - "Download" buttons (placeholder for now)

### 4. Test Language Toggle

Click the language button (EN/SW) in the top navigation to switch between English and Swahili.

## 📁 Project Structure

```
src/
├── server.ts              # Backend server entry point (NEW)
├── api-server.ts          # Express app with routes
├── metadata.ts            # TMDB integration
├── downloader.ts          # Download engine interface
├── main/
│   ├── main.ts           # Electron main process (UPDATED)
│   └── preload.ts        # IPC bridge
└── renderer/
    ├── index.html        # HTML shell (UPDATED CSP)
    ├── main.tsx          # React entry point
    ├── App.tsx           # Main app component
    └── views/
        ├── DiscoveryView.tsx    # TMDB search (UPDATED)
        └── DownloadsView.tsx    # SSE progress (UPDATED)
```

## 🐛 Troubleshooting

### "HTTP ERROR 401" or "Cannot GET /"

**Problem:** Electron is loading the wrong URL or CSP is blocking requests.

**Solution:**
- Ensure all three processes are running (`npm run dev`)
- Check that Vite is serving on http://localhost:5173
- Check that backend is serving on http://localhost:3000
- Verify `NODE_ENV=development` in `.env`

### "TMDB_API_KEY not configured"

**Problem:** Environment variables not loaded.

**Solution:**
- Ensure `.env` file exists in project root
- Check that `TMDB_API_KEY` is set in `.env`
- Restart the dev server after changing `.env`

### Port Already in Use

**Problem:** Port 3000 or 5173 is occupied.

**Solution:**
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes on port 5173
lsof -ti:5173 | xargs kill -9
```

### Electron Window Shows Blank Screen

**Problem:** CSP blocking resources or React rendering error.

**Solution:**
- Open DevTools in Electron window (Ctrl+Shift+I)
- Check Console for errors
- Check Network tab for failed requests
- Verify CSP allows `http://localhost:*`

## 📊 What's Working Now

✅ **Backend API Server**
- `/metadata/search?q=<query>` - Search TMDB
- `/metadata/:mediaType/:id` - Get movie/TV details
- `/download/start` - Start download (WebTorrent)
- `/download/pause` - Pause download
- `/download/resume` - Resume download
- `/download/cancel` - Cancel download
- `/download/status/:id` - Get download status
- `/events/:id` - SSE real-time progress

✅ **Frontend UI**
- React with React Router
- i18next for EN/SW translations
- Accessibility (ARIA labels, axe-core)
- Discovery view with live TMDB search
- Downloads view with SSE progress display

✅ **Electron Integration**
- IPC bridge for backend communication
- Context isolation and sandboxing
- Window management
- DevTools in development mode

## 🚧 Work in Progress

⏳ **Download Flow**
- Connecting Discovery → Downloads (download button)
- YouTube downloader integration
- Video player component

⏳ **Settings View**
- Download location picker
- Bandwidth limits
- Privacy/telemetry controls

⏳ **Library Management**
- Offline media playback
- Missing file handling
- Subtitle management

## 📝 Next Steps

1. Test the Discovery search with various queries
2. Verify TMDB images load correctly
3. Test language toggle (EN ↔ SW)
4. Implement download button functionality
5. Connect Downloads view to real download engine
6. Add video player component

---

**Last Updated:** 2025-10-16  
**Branch:** `001-chilly-movies-a`  
**Status:** Development environment fixed and ready for testing ✅
