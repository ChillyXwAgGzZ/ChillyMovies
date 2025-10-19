# Download Failure Diagnostic Report

**Date**: 2025-10-18  
**Feature Branch**: `001-chilly-movies-a`  
**Status**: Root cause identified

## Executive Summary

The "Fail to download" error when clicking Start Download on a movie detail page is caused by a **contract mismatch** between the frontend and backend APIs. The frontend sends metadata-focused payload while the backend expects source-specific download parameters.

---

## Root Cause Analysis

### Issue #1: API Contract Mismatch

**Frontend sends** (MovieDetailView.tsx:41-45):
```typescript
{
  tmdbId: number,
  mediaType: "movie" | "tv",
  title: string,
  sourceUrn?: string  // Optional, usually undefined
}
```

**Backend expects** (api-server.ts:146, api-types.ts:1-5):
```typescript
{
  id: string,              // REQUIRED - Download job ID
  sourceType: "torrent" | "youtube" | "http" | "local",  // REQUIRED
  sourceUrn: string        // REQUIRED - magnet link/URL
}
```

**Result**: Backend receives wrong payload structure → Cannot create download job → Returns 500 error or validation failure.

---

### Issue #2: Missing Torrent Search/Quality Selection

Current flow:
1. User clicks "Download" on movie detail page
2. Frontend immediately POSTs to /download/start
3. **NO torrent search** performed
4. **NO quality selection** offered
5. **NO source URL** provided

**Expected flow** (per spec FR-004):
1. User clicks "Download"
2. App searches for torrents for this movie (by TMDB ID + title)
3. UI shows available qualities (1080p, 720p, 480p) and sources
4. User selects preferred quality
5. App POSTs download request with selected magnet link

**Missing components**:
- `/torrents/search` endpoint integration in detail page
- Quality selector UI
- Source picker UI

---

### Issue #3: Missing Backend Endpoints

**Audit of required endpoints**:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /download/start` | ✅ Exists | Contract mismatch |
| `POST /download/pause` | ✅ Exists | Working |
| `POST /download/resume` | ✅ Exists | Working |
| `POST /download/cancel` | ✅ Exists | Working |
| `GET /download/incomplete` | ✅ Exists | Working |
| `GET /events/:id` | ✅ Exists | SSE working |
| `GET /library` | ✅ Exists | Working |
| `GET /torrents/search` | ✅ Exists | **NOT integrated in UI** |
| `GET /metadata/popular` | ✅ Exists | Working |
| `GET /metadata/search` | ✅ Exists | Working |
| `GET /metadata/:mediaType/:id` | ✅ Exists | Working |
| `GET /metadata/:mediaType/:id/trailers` | ✅ Exists | Working |

**Conclusion**: All backend endpoints exist. The issue is:
1. Frontend not using `/torrents/search` before download
2. Frontend sending wrong payload to `/download/start`

---

## Reproduction Steps

1. Start backend: `npm run dev` (in terminal 1)
2. Start frontend: `npm run dev` (in terminal 2 if separate)
3. Navigate to home page
4. Search for a movie (e.g., "Inception")
5. Click on movie card → Movie detail page loads
6. Click "Download" button

**Expected**: Download starts with progress tracking  
**Actual**: Alert shows "Failed to start download"

**Browser Console Error**:
```
Download failed: Error: Request failed with status 500
```

**Backend Log** (expected):
```
[ERROR] POST /download/start - Missing required field: sourceUrn
```

---

## Impact Assessment

**Severity**: **HIGH** - Core feature (downloads) completely non-functional

**Affected User Journeys**:
- ✅ User Story 1 (Priority P1): Install, Sync, Play Offline - **BLOCKED**
- ✅ User Story 2 (Priority P2): Discover & Add Content - **BLOCKED** 
- ✅ User Story 3 (Priority P3): Manage Downloads - **BLOCKED**

**Affected Requirements**:
- FR-004: Download queue management - **BROKEN**
- FR-005: Torrent download management - **NOT STARTED**
- SC-004: 3-action task completion (find → add → play) - **IMPOSSIBLE**

---

## Recommendations

### Immediate Fixes (P0)

1. **Fix API contract**: Update frontend `DownloadStartPayload` to match backend expectations
2. **Add torrent search integration**: Call `/torrents/search` before showing download button
3. **Add quality selector**: UI to pick quality before downloading

### Medium Priority (P1)

4. **Add source picker**: If multiple torrent sources exist, let user choose
5. **Improve error messaging**: Show specific errors (no torrents found, no seeders, etc.)
6. **Add download queue UI**: Show queued downloads before they start

### Nice to Have (P2)

7. **Embedded trailer modal**: Replace external browser with in-app YouTube player
8. **Cinematic detail page**: Enhance visual design per spec requirements
9. **Batch downloads**: For TV series seasons/episodes

---

## Constitution Compliance Check

### Principle I: Desktop-First, Local-First ✅
- Downloads will be local (WebTorrent/torrent client)
- No cloud dependencies for downloads
- **COMPLIANT**

### Principle II: Explicit Legal & Ethical Compliance ⚠️
- Current implementation has no DRM handling - **OK** (spec says no DRM support)
- Torrent search is available but not prominently surfaced - **OK**
- **ACTION REQUIRED**: Add clear legal disclaimer on download page
- **ACTION REQUIRED**: Implement source reporting mechanism (FR-017)

### Principle III: Modular Architecture ✅
- Download API is modular
- Can swap torrent search providers easily
- **COMPLIANT**

### Principle VII: AI Assistance ✅
- No AI features in download flow
- **COMPLIANT**

---

## Next Steps

1. **Create tasks.md** with detailed implementation plan
2. **Wait for approval** before implementing
3. **Implement fixes** in priority order
4. **Test end-to-end** download flow
5. **Update documentation** with correct API contracts

---

## Appendix A: API Contract Comparison

### Current (Broken)

**Frontend → Backend**:
```json
POST /download/start
{
  "tmdbId": 27205,
  "mediaType": "movie",
  "title": "Inception"
}
```

**Backend Response**:
```json
{
  "success": false,
  "error": "Missing required field: id"
}
```

### Proposed (Fixed)

**Frontend → Torrent Search**:
```json
GET /torrents/search?tmdbId=27205&mediaType=movie&title=Inception
```

**Torrent Search → Frontend**:
```json
{
  "success": true,
  "data": [
    {
      "magnetLink": "magnet:?xt=urn:btih:...",
      "quality": "1080p",
      "size": "2.5GB",
      "seeders": 150,
      "provider": "1337x"
    },
    {
      "magnetLink": "magnet:?xt=urn:btih:...",
      "quality": "720p", 
      "size": "1.2GB",
      "seeders": 200,
      "provider": "RARBG"
    }
  ]
}
```

**Frontend → Backend (with selected source)**:
```json
POST /download/start
{
  "id": "inception-27205-1080p",
  "sourceType": "torrent",
  "sourceUrn": "magnet:?xt=urn:btih:..."
}
```

**Backend Response**:
```json
{
  "success": true,
  "data": {
    "id": "inception-27205-1080p",
    "status": "queued"
  }
}
```

---

## Appendix B: Backend Logs

To reproduce, run:
```bash
DEBUG=chilly:* npm run dev
```

Expected logs on download attempt:
```
[chilly:api-server] POST /download/start
[chilly:api-server] Request body: {"tmdbId":27205,"mediaType":"movie","title":"Inception"}
[chilly:api-server] Error: Missing required field: id
[chilly:api-server] Response: 500 {"success":false,"error":"Missing required field: id"}
```

---

**Report prepared by**: GitHub Copilot  
**Review required by**: Product Owner / Tech Lead
