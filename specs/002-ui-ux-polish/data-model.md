# Data Model: UI/UX Enhancements

## Entities

### Theme Settings
**Purpose:** Store user theme preference

```typescript
interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  lastUpdated: Date;
}
```

**Storage:** localStorage key `chilly-theme`
**Validation:** mode must be one of the enum values
**State:** Managed via React Context

### Download Location Settings
**Purpose:** Store user-selected download directory

```typescript
interface DownloadSettings {
  downloadPath: string;
  customPath?: string;
  lastUpdated: Date;
}
```

**Storage:** Backend configuration file + localStorage
**Validation:** Path must exist and be writable
**Default:** OS-specific (e.g., ~/Downloads on Unix, C:\Users\{user}\Downloads on Windows)

### Enhanced Download Job (Extension)
**Purpose:** Add TV episode metadata to existing DownloadJob

```typescript
interface DownloadJob {
  // Existing fields
  id: string;
  sourceType: "torrent" | "youtube" | "local";
  sourceUrn: string;
  progress: number;
  speed?: number;
  eta?: number;
  status: "queued" | "active" | "paused" | "completed" | "error";
  peers?: number;
  errorState?: string;
  
  // New episode-specific metadata
  metadata?: {
    tmdbId: number;
    mediaType: "movie" | "tv";
    quality: string;
    seasonNumber?: number;    // NEW
    episodeNumber?: number;   // NEW
    episodeName?: string;     // NEW
    stillPath?: string;       // NEW (episode thumbnail)
    torrentInfo?: {
      seeders: number;
      leechers: number;
      size: string;
      provider: string;
    };
  };
}
```

**State:** Managed by backend, synced via SSE
**Validation:** seasonNumber and episodeNumber required when mediaType is "tv"

### Library Item (Extension)
**Purpose:** Add deletable flag and file metadata

```typescript
interface LibraryItem {
  id: string;
  title: string;
  metadata: {
    tmdbId?: number;
    mediaType?: "movie" | "tv";
    seasonNumber?: number;
    episodeNumber?: number;
    quality?: string;
    fileSize?: number;        // NEW
    filePath?: string;        // NEW
    addedAt?: Date;          // NEW
  };
  createdAt: string;
  
  // Runtime computed
  canDelete: boolean;        // NEW
  canPlay: boolean;          // NEW
}
```

**Storage:** Existing storage.ts database
**Validation:** filePath must exist to enable play/delete
**State:** Fetched from backend, cached in frontend

## State Transitions

### Theme Mode
```
[System] --user selects dark--> [Dark]
[Dark] --user selects light--> [Light]
[Light] --user selects system--> [System]
[System] --OS changes theme--> [System] (with updated rendering)
```

### Download Job with Episodes
```
[Queued] --start download--> [Active]
[Active] --progress update--> [Active] (with updated progress)
[Active] --complete--> [Completed]
[Active] --error--> [Error]
[Error] --retry--> [Queued]
[Any] --user cancel--> [Cancelled]
```

### Library Item Lifecycle
```
[Downloaded] --user plays--> [Playing]
[Playing] --playback ends--> [Downloaded]
[Downloaded] --user deletes (with confirm)--> [Deleting]
[Deleting] --success--> [Deleted] (removed from list)
[Deleting] --error--> [Downloaded] (with error toast)
```

## Relationships

### Download Job → Library Item
- **Type:** One-to-One
- **Rule:** Completed download creates library item
- **Cascade:** Deleting library item does not cancel download (if active)

### Settings → All Components
- **Type:** Global State
- **Rule:** Theme affects all components via CSS classes
- **Rule:** Download path affects backend download location

## Validation Rules

### Theme Settings
- `mode` must be 'light' | 'dark' | 'system'
- Persisted on every change
- Applied immediately via DOM class toggle

### Download Path
- Must be absolute path
- Must exist on filesystem
- Must have write permissions
- Validated on backend before saving

### Episode Downloads
- `mediaType: "tv"` requires `seasonNumber` and `episodeNumber`
- Episode naming format: `{showName} S{season}E{episode} - {episodeName}`
- Quality must be valid (1080p, 720p, 480p, etc.)

### Library Deletion
- Requires confirmation dialog
- Must check file exists before deletion
- Must update storage after deletion
- Must refresh library list UI

## Indexing & Performance

### Theme Lookup
- **Method:** localStorage.getItem('chilly-theme')
- **Fallback:** Check system preference via window.matchMedia
- **Cache:** In memory via React Context

### Library Items
- **Current:** Array in JSON database
- **Index:** By ID (already present)
- **Optimization:** Add timestamp index for "recently added" sorting

### Download Jobs
- **Current:** Map by ID in backend
- **UI Filter:** Active downloads shown first, then completed
- **Optimization:** Separate completed downloads after 24 hours

## Migration Strategy
No schema migrations required - all changes are additive:
- New fields in metadata are optional
- Theme settings are new localStorage key
- Download path has sensible defaults

## Example Data

### Theme Settings
```json
{
  "mode": "dark",
  "lastUpdated": "2025-10-19T10:30:00Z"
}
```

### Enhanced Download Job
```json
{
  "id": "tv-12345-1080p-1729335000000",
  "sourceType": "torrent",
  "sourceUrn": "magnet:?xt=urn:btih:...",
  "progress": 45,
  "speed": 5242880,
  "eta": 120,
  "status": "active",
  "peers": 23,
  "metadata": {
    "tmdbId": 12345,
    "mediaType": "tv",
    "quality": "1080p",
    "seasonNumber": 1,
    "episodeNumber": 3,
    "episodeName": "The One with the Thumb",
    "stillPath": "https://image.tmdb.org/t/p/w500/abc123.jpg",
    "torrentInfo": {
      "seeders": 150,
      "leechers": 23,
      "size": "1.2 GB",
      "provider": "1337x"
    }
  }
}
```

### Library Item with Metadata
```json
{
  "id": "tv-12345-s01e03",
  "title": "Friends S01E03 - The One with the Thumb",
  "metadata": {
    "tmdbId": 12345,
    "mediaType": "tv",
    "seasonNumber": 1,
    "episodeNumber": 3,
    "quality": "1080p",
    "fileSize": 1288490188,
    "filePath": "/Users/john/Downloads/Friends.S01E03.1080p.mkv",
    "addedAt": "2025-10-19T09:15:00Z"
  },
  "createdAt": "2025-10-19T09:15:00.000Z",
  "canDelete": true,
  "canPlay": true
}
```
