# Backend API Endpoints Audit

**Purpose**: Document existing backend endpoints and identify gaps for UI integration

## ✅ Existing Endpoints (Ready to Use)

### Metadata Endpoints
- `GET /metadata/search?q=...` - Search movies/TV by title
- `GET /metadata/:mediaType/:id` - Get movie/TV details by TMDB ID (mediaType: 'movie' | 'tv')
- `GET /metadata/:mediaType/:id/trailers` - Get trailers for a movie/TV show
- `GET /metadata/cache/stats` - Get cache statistics
- `POST /metadata/cache/clear` - Clear metadata cache (requires auth)

### Download Endpoints
- `POST /download/start` - Start a new download (requires auth, rate limited)
- `POST /download/pause` - Pause a download (requires auth)
- `POST /download/resume` - Resume a paused download (requires auth)
- `POST /download/cancel` - Cancel a download (requires auth, rate limited)
- `GET /download/status/:id` - Get download status
- `GET /download/incomplete` - List incomplete downloads
- `GET /events/:id` - SSE endpoint for real-time download progress

### Torrent Endpoints
- `GET /torrents/search?q=...` - Search torrents
- `GET /torrents/providers` - List available torrent providers
- `POST /torrents/cache/clear` - Clear torrent cache (requires auth)

### Library Endpoints
- `GET /library/validate` - Validate library integrity
- `GET /library/missing` - List missing media files
- `GET /library/missing/report` - Get missing files report
- `POST /library/relink` - Relink a missing media file (requires auth)
- `GET /library/:mediaId/subtitles` - List subtitle tracks for media
- `GET /library/:mediaId/subtitles/detect` - Detect subtitle files for media

## ❌ Missing Endpoints (Need to Add)

### Library List
- `GET /library` - **MISSING** - List all downloaded media items
  - **Workaround**: Storage manager has `getAllItems()` method
  - **Action Required**: Add endpoint to expose this

### Popular/Discovery
- `GET /metadata/popular` - **MISSING** - Get popular movies/TV
  - **Workaround**: Can use TMDB discover API directly or extend metadata fetcher
  - **Action Required**: Add endpoint or use client-side TMDB API calls

### Media Playback
- `GET /media/:id/stream` - **MISSING** - Stream media file
  - **Note**: Not critical for Phase 5 (can use file:// URLs or external player)
  - **Action Required**: Defer to later phase

## 📝 Storage Manager Methods (Available)

The `StorageManager` class provides:
- `addMediaItem(id, title, metadata)` - Add media to library
- `getMediaItem(id)` - Get single media item
- `getAllItems()` - **Get all media items** (can use for library list)
- `getMediaRoot()` - Get media storage directory
- `getPartialPath(id)` - Get partial download path
- `getPartialSize(id)` - Get partial download size
- `removePartial(id)` - Remove partial download file

## 🔧 Required Backend Changes

### 1. Add Library List Endpoint
```typescript
app.get("/library", async (req: Request, res: Response) => {
  try {
    const items = storage.getAllItems();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
```

### 2. Add Popular/Discovery Endpoint (Optional)
```typescript
app.get("/metadata/popular", async (req: Request, res: Response) => {
  const { mediaType = "movie", page = "1" } = req.query;
  try {
    const results = await metadata.fetchPopular(mediaType as "movie" | "tv", parseInt(page));
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
```

### 3. Extend TMDBMetadataFetcher (if popular endpoint added)
```typescript
async fetchPopular(mediaType: "movie" | "tv", page: number = 1) {
  const url = `https://api.themoviedb.org/3/${mediaType}/popular?api_key=${this.apiKey}&page=${page}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}
```

## 🎯 Frontend Integration Plan

### Phase 1: Use Existing Endpoints
1. `/metadata/search` for search functionality ✅
2. `/metadata/:mediaType/:id` for detail pages ✅
3. `/download/start` for download actions ✅
4. `/events/:id` for SSE progress tracking ✅
5. `/download/pause|resume|cancel` for controls ✅

### Phase 2: Add Missing Endpoints
1. Add `GET /library` endpoint (15 min)
2. Add `GET /metadata/popular` endpoint (30 min)
3. Update API contracts/OpenAPI spec (15 min)

### Phase 3: Frontend Implementation
1. Create API service layer (2 hours)
2. Implement data fetching in views (4 hours)
3. Add SSE progress tracking (2 hours)
4. Wire up all interactive controls (2 hours)

## ✅ Auth & Rate Limiting

All mutation endpoints require `authMiddleware`:
- `/download/start` - Also has `startLimiter` (10 req/min)
- `/download/pause` - Auth required
- `/download/resume` - Auth required
- `/download/cancel` - Also has `cancelLimiter` (20 req/min)
- `/metadata/cache/clear` - Auth required
- `/torrents/cache/clear` - Auth required
- `/library/relink` - Auth required

**Note**: Frontend must handle auth headers or cookies for these endpoints.

## 🔐 API Response Format

All endpoints follow this pattern:
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Example success:
```json
{
  "success": true,
  "data": { ... }
}
```

Example error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 📊 SSE Event Format

`GET /events/:id` returns Server-Sent Events:
```
event: progress
data: {"downloadId":"abc123","progress":45.5,"speed":2.3,"eta":120}

event: complete
data: {"downloadId":"abc123","status":"completed"}

event: error
data: {"downloadId":"abc123","error":"Network timeout"}
```

Event types:
- `progress` - Download progress update
- `complete` - Download completed
- `error` - Download error
- `paused` - Download paused
- `resumed` - Download resumed
- `cancelled` - Download cancelled
