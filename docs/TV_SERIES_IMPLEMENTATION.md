# TV Series & Batch Download Implementation

## Overview

ChillyMovies now supports comprehensive TV series functionality including episode browsing, selective downloads, season pack handling, and batch episode downloads. This implementation integrates with TMDB for metadata and supports both individual episode downloads and efficient season pack management through ARIA2.

## Key Features

### 1. TV Series Metadata Fetching

- **Season Listing**: Fetch all seasons for a TV show
- **Episode Details**: Get detailed information for each episode in a season
- **TMDB Integration**: Full metadata including air dates, overviews, ratings, and thumbnails

#### API Endpoints

```
GET /metadata/tv/:id/seasons
GET /metadata/tv/:id/season/:seasonNumber
```

#### Example Usage

```bash
# Get all seasons for Breaking Bad (TMDB ID: 1396)
curl http://localhost:3001/metadata/tv/1396/seasons

# Get episodes for Season 1
curl http://localhost:3001/metadata/tv/1396/season/1
```

### 2. File Selection for Season Packs

When downloading season packs (torrents containing multiple episodes), you can selectively download specific episodes rather than the entire pack.

#### List Files in Torrent

```bash
POST /download/list-files
{
  "magnetLink": "magnet:?xt=urn:btih:..."
}
```

Response:
```json
{
  "success": true,
  "data": [
    { "index": 0, "path": "Show.S01E01.1080p.mkv", "size": 524288000 },
    { "index": 1, "path": "Show.S01E02.1080p.mkv", "size": 524288000 },
    { "index": 2, "path": "Show.S01E03.1080p.mkv", "size": 524288000 }
  ]
}
```

#### Download with File Selection

```bash
POST /download/start
{
  "id": "custom-job-id",
  "sourceType": "torrent",
  "sourceUrn": "magnet:?xt=urn:btih:...",
  "fileSelection": {
    "fileIndices": [0, 2, 4]  // Download episodes 1, 3, and 5
  }
}
```

### 3. Batch Downloads

Download multiple episodes automatically with a single API call.

#### Download Full Season

```bash
POST /download/batch
{
  "tmdbId": 1396,
  "mediaType": "tv",
  "title": "Breaking Bad",
  "seasonNumber": 1,
  "quality": "1080p",
  "batchDownload": {
    "fullSeason": true
  }
}
```

This will:
1. Search for a season pack torrent
2. Start download with all episodes selected
3. Return a batch ID for tracking

#### Download Specific Episodes

```bash
POST /download/batch
{
  "tmdbId": 1396,
  "mediaType": "tv",
  "title": "Breaking Bad",
  "quality": "1080p",
  "batchDownload": {
    "episodes": [
      { "seasonNumber": 1, "episodeNumber": 1 },
      { "seasonNumber": 1, "episodeNumber": 2 },
      { "seasonNumber": 1, "episodeNumber": 3 }
    ],
    "mode": "sequential"  // or "parallel"
  }
}
```

This will:
1. Search for torrents for each episode individually
2. Start downloads in sequential or parallel mode
3. Return batch ID and list of download job IDs

#### Batch Download Modes

- **Sequential**: Episodes downloaded one after another (default)
  - More reliable for limited bandwidth
  - Prevents overwhelming the system
  
- **Parallel**: All episodes downloaded simultaneously
  - Faster completion if bandwidth allows
  - Requires more system resources

### 4. Episode Tracking

The system tracks episode downloads in the database for better organization.

#### Database Schema

```sql
CREATE TABLE tv_episodes (
  id TEXT PRIMARY KEY,
  tmdb_id INTEGER,
  season_number INTEGER,
  episode_number INTEGER,
  title TEXT,
  download_id TEXT,
  status TEXT,
  metadata_json TEXT,
  created_at TEXT
);

CREATE TABLE batch_downloads (
  batch_id TEXT PRIMARY KEY,
  tmdb_id INTEGER,
  season_number INTEGER,
  total_episodes INTEGER,
  completed_episodes INTEGER,
  failed_episodes INTEGER,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

#### Storage API

```typescript
// Add episode to tracking
storage.addTVEpisode(tmdbId, seasonNumber, episodeNumber, title, downloadId, metadata);

// Update episode status
storage.updateEpisodeStatus(tmdbId, seasonNumber, episodeNumber, 'completed');

// Get all episodes for a show
const episodes = storage.getTVEpisodes(tmdbId);

// Get episodes for specific season
const seasonEpisodes = storage.getTVEpisodes(tmdbId, seasonNumber);

// Create batch download tracker
storage.createBatchDownload(batchId, tmdbId, seasonNumber, totalEpisodes);

// Update batch progress
storage.updateBatchDownload(batchId, { completed: 5, failed: 1 });
```

## ARIA2 Integration

### File Selection Support

ARIA2 downloader now supports selective file downloads through the `select-file` option.

```typescript
const job: DownloadJob = {
  id: "job-123",
  sourceType: "torrent",
  sourceUrn: "magnet:...",
  status: "queued",
  fileSelection: {
    fileIndices: [0, 2, 4],  // 0-based indices
    episodes: [
      { seasonNumber: 1, episodeNumber: 1 },
      { seasonNumber: 1, episodeNumber: 3 },
      { seasonNumber: 1, episodeNumber: 5 }
    ]
  }
};

await aria2Downloader.start(job);
```

### List Files Before Download

```typescript
const files = await aria2Downloader.listFiles("magnet:?xt=urn:btih:...");
// Returns: [{ index: 0, path: "...", size: ... }, ...]
```

This uses ARIA2's metadata-only mode to fetch file list without downloading.

## Episode Filename Pattern Matching

The system supports multiple common TV episode naming patterns:

- `S01E01` - Standard format (e.g., `Show.S01E01.1080p.mkv`)
- `1x01` - Alternative format (e.g., `Show.1x01.1080p.mkv`)
- `101` - Compact format (e.g., `Show.101.1080p.mkv` = Season 1, Episode 01)

Pattern matching helps automatically identify episodes in season packs.

```typescript
const patterns = [
  /S(\d{2})E(\d{2})/i,   // S01E01
  /(\d{1,2})x(\d{2})/i,  // 1x01
  /\.(\d)(\d{2})\./      // .101.
];
```

## Data Flow

### Full Season Download Flow

```
1. User → POST /download/batch (fullSeason: true)
2. API → Search for season pack torrent
3. API → Create download job with metadata
4. ARIA2 → Download entire season pack
5. Storage → Track season download
6. Storage → Mark episodes as downloaded
7. Events → Notify progress to clients
```

### Selective Episode Download Flow

```
1. User → POST /download/list-files
2. ARIA2 → Fetch torrent metadata
3. ARIA2 → Return file list
4. User → Select specific episodes
5. User → POST /download/start (with fileSelection)
6. ARIA2 → Download only selected files
7. Storage → Track individual episodes
```

### Batch Episode Download Flow

```
1. User → POST /download/batch (episodes list)
2. API → Search for each episode torrent
3. API → Create download job for each
4. API → Start downloads (sequential/parallel)
5. Storage → Track batch progress
6. Storage → Update completed/failed counts
7. Events → Notify batch status
```

## Testing

Comprehensive test suites cover all TV series functionality:

### Test Files

1. **tests/tv-series.test.ts** - Storage and metadata tests
   - Episode tracking
   - Batch download tracking
   - Season/episode queries
   - TMDB metadata fetching

2. **tests/batch-download.test.ts** - API endpoint tests
   - File listing
   - Batch download requests
   - Episode pattern matching
   - Download job creation

3. **tests/aria2-file-selection.test.ts** - ARIA2 integration tests
   - File selection in download jobs
   - Episode-based selection
   - Pattern-based filtering
   - Configuration validation

### Running Tests

```bash
# Run all TV series tests
npm test -- tv-series.test.ts

# Run batch download tests
npm test -- batch-download.test.ts

# Run ARIA2 tests
npm test -- aria2-file-selection.test.ts

# Run all tests
npm test
```

## API Response Types

### TVSeasonResponse
```typescript
{
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airDate?: string;
  posterPath?: string;
  overview: string;
}
```

### TVEpisodeResponse
```typescript
{
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  airDate?: string;
  runtime?: number;
  stillPath?: string;
  voteAverage?: number;
}
```

### BatchDownloadStatusResponse
```typescript
{
  batchId: string;
  totalEpisodes: number;
  completedEpisodes: number;
  failedEpisodes: number;
  activeDownloads: string[];
  status: 'queued' | 'active' | 'completed' | 'partial' | 'failed';
}
```

## Best Practices

### For End Users

1. **Use Season Packs**: More efficient than individual episodes
2. **Select Episodes**: Only download what you need from season packs
3. **Sequential Mode**: Use for limited bandwidth scenarios
4. **Monitor Progress**: Use SSE events or status endpoints

### For Developers

1. **Validate Episodes**: Check episode numbers exist in season
2. **Handle Failures**: Batch downloads may have partial failures
3. **Cache Metadata**: TMDB data is cached for performance
4. **Clean Up**: Remove completed downloads from tracking

## Error Handling

### Common Errors

- **No Torrent Found**: Episode or season not available
- **File Selection Invalid**: Requested indices don't exist
- **ARIA2 Not Available**: listFiles requires ARIA2 downloader
- **Rate Limits**: TMDB API rate limit exceeded

### Error Responses

```json
{
  "success": false,
  "error": "No torrents found for Breaking Bad S01E01 1080p"
}
```

## Performance Considerations

### Caching

- TMDB metadata cached for 6 hours
- Season data cached for 6 hours
- Trailer data cached for 24 hours
- Search results cached for 30 minutes

### Resource Usage

- **Sequential Downloads**: Lower memory, CPU usage
- **Parallel Downloads**: Higher throughput, more resources
- **File Selection**: Saves bandwidth and storage
- **ARIA2 Process**: Persistent process for efficiency

## Future Enhancements

Potential improvements for future releases:

1. **Smart Episode Selection**: Auto-detect unwatched episodes
2. **Quality Profiles**: Preferred quality per show
3. **Automatic Upgrades**: Replace lower quality with better versions
4. **Subtitle Integration**: Auto-download matching subtitles
5. **Watch Progress Tracking**: Mark episodes as watched
6. **Recommendations**: Suggest similar shows
7. **Calendar Integration**: Track upcoming episodes
8. **Notification System**: Alert when new episodes available

## Troubleshooting

### Episode Not Found
- Verify TMDB ID is correct
- Check season/episode numbers exist
- Ensure TMDB API key is configured

### Download Fails
- Check torrent has seeders
- Verify ARIA2 is running
- Check disk space available
- Review ARIA2 logs

### File Selection Not Working
- Ensure using ARIA2 downloader (not WebTorrent)
- Verify file indices are correct (0-based)
- Check torrent metadata loaded successfully

### Batch Download Stalls
- Review individual download statuses
- Check system resource availability
- Try sequential mode instead of parallel
- Verify network connectivity

## Migration Guide

For existing ChillyMovies installations, no migration is needed. The new TV series features are additive:

- New database tables created automatically
- Existing movie downloads unaffected
- New API endpoints alongside existing ones
- Storage manager backwards compatible

## Conclusion

The TV series and batch download implementation provides a robust, efficient way to manage TV show downloads in ChillyMovies. With ARIA2 integration for selective downloads and comprehensive tracking through the storage layer, users can efficiently manage their TV series library while developers have powerful APIs to build upon.
