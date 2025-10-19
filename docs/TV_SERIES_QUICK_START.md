# TV Series Quick Start Guide

## Getting Started with TV Series in ChillyMovies

ChillyMovies now supports full TV series management! Download entire seasons, specific episodes, or selectively choose episodes from season packs.

## Basic Usage

### 1. Browse TV Shows

First, search for a TV show using TMDB:

```bash
# Search for a show
curl "http://localhost:3001/metadata/search?q=Breaking%20Bad"

# Get show details
curl "http://localhost:3001/metadata/tv/1396"  # Breaking Bad TMDB ID

# List all seasons
curl "http://localhost:3001/metadata/tv/1396/seasons"

# Get episodes for Season 1
curl "http://localhost:3001/metadata/tv/1396/season/1"
```

### 2. Download Options

#### Option A: Download Single Episode

```bash
curl -X POST http://localhost:3001/download/start \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 1396,
    "mediaType": "tv",
    "title": "Breaking Bad",
    "seasonNumber": 1,
    "episodeNumber": 1,
    "quality": "1080p"
  }'
```

The system will:
1. Search for "Breaking Bad S01E01 1080p"
2. Find best torrent (most seeders)
3. Start download automatically

#### Option B: Download Full Season

```bash
curl -X POST http://localhost:3001/download/batch \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 1396,
    "mediaType": "tv",
    "title": "Breaking Bad",
    "seasonNumber": 1,
    "quality": "1080p",
    "batchDownload": {
      "fullSeason": true
    }
  }'
```

The system will:
1. Search for "Breaking Bad S01 1080p" (season pack)
2. Download the entire season in one torrent
3. Track progress in batch system

#### Option C: Download Specific Episodes

```bash
curl -X POST http://localhost:3001/download/batch \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 1396,
    "mediaType": "tv",
    "title": "Breaking Bad",
    "quality": "1080p",
    "batchDownload": {
      "episodes": [
        {"seasonNumber": 1, "episodeNumber": 1},
        {"seasonNumber": 1, "episodeNumber": 2},
        {"seasonNumber": 1, "episodeNumber": 5}
      ],
      "mode": "sequential"
    }
  }'
```

Modes:
- **sequential**: Download one episode at a time (safer, less bandwidth)
- **parallel**: Download all episodes simultaneously (faster if you have bandwidth)

#### Option D: Selective Download from Season Pack (Advanced)

Perfect when you already have some episodes and only need specific ones:

```bash
# Step 1: Get the magnet link for season pack
# (search manually or use torrent search API)

# Step 2: List all files in the torrent
curl -X POST http://localhost:3001/download/list-files \
  -H "Content-Type: application/json" \
  -d '{
    "magnetLink": "magnet:?xt=urn:btih:YOUR_HASH_HERE"
  }'

# Response shows files:
# [
#   {"index": 0, "path": "Breaking.Bad.S01E01.mkv", "size": 500000000},
#   {"index": 1, "path": "Breaking.Bad.S01E02.mkv", "size": 520000000},
#   {"index": 2, "path": "Breaking.Bad.S01E03.mkv", "size": 510000000},
#   ...
# ]

# Step 3: Download only episodes 1, 3, and 5
curl -X POST http://localhost:3001/download/start \
  -H "Content-Type: application/json" \
  -d '{
    "id": "breaking-bad-s1-selected",
    "sourceType": "torrent",
    "sourceUrn": "magnet:?xt=urn:btih:YOUR_HASH_HERE",
    "fileSelection": {
      "fileIndices": [0, 2, 4]
    }
  }'
```

This saves bandwidth by only downloading the episodes you need!

## Features

### ✅ Smart Episode Detection
- Automatically matches episode patterns: S01E01, 1x01, 101
- Works with most common torrent naming schemes

### ✅ Progress Tracking
- Track individual episode downloads
- Monitor batch download progress
- View completed/failed episode counts

### ✅ ARIA2 Power (Recommended)
- More stable than WebTorrent
- Supports selective file downloads
- Better for large season packs

### ✅ Metadata Integration
- Full TMDB metadata for shows, seasons, episodes
- Episode titles, air dates, overviews, ratings
- Episode thumbnails and show posters

## Configuration

### Using ARIA2 Downloader (Recommended for TV Series)

To use ARIA2 with file selection support, ensure aria2c is installed:

```bash
# Ubuntu/Debian
sudo apt-get install aria2

# macOS
brew install aria2

# Check installation
aria2c --version
```

Then configure ChillyMovies to use ARIA2 in your environment or API calls.

### Tips for Best Experience

1. **Use Season Packs**: More efficient than individual episodes
2. **Sequential Mode**: Better for limited bandwidth
3. **Quality Selection**: 1080p is good balance of quality and size
4. **Check Seeders**: More seeders = faster downloads

## Monitoring Downloads

### Check Download Status

```bash
curl "http://localhost:3001/download/status/YOUR_JOB_ID"
```

### Stream Progress (Server-Sent Events)

```bash
curl "http://localhost:3001/events/YOUR_JOB_ID"
```

This keeps the connection open and streams progress updates in real-time.

### View Library

```bash
curl "http://localhost:3001/library"
```

Shows all downloaded media including TV episodes.

## Troubleshooting

### No Torrents Found
- Try different quality (720p, 1080p, 2160p)
- Check if show name is correct
- Verify season/episode numbers exist
- Try manual magnet link

### Download Stalls
- Check seeders (need at least 3-5)
- Verify internet connection
- Check disk space
- Try different torrent

### File Selection Not Working
- Ensure using ARIA2 downloader (not WebTorrent)
- Verify aria2c is installed: `aria2c --version`
- Check file indices are correct (0-based)

### Rate Limits
- TMDB: 40 requests per 10 seconds
- Torrent Search: Varies by provider
- If hitting limits, wait a minute and retry

## Examples by Use Case

### Binge Watching - Download Full Series

```bash
# Download all of Season 1
curl -X POST http://localhost:3001/download/batch \
  -d '{"tmdbId":1396,"mediaType":"tv","title":"Breaking Bad","seasonNumber":1,"quality":"1080p","batchDownload":{"fullSeason":true}}'

# Download all of Season 2
curl -X POST http://localhost:3001/download/batch \
  -d '{"tmdbId":1396,"mediaType":"tv","title":"Breaking Bad","seasonNumber":2,"quality":"1080p","batchDownload":{"fullSeason":true}}'
```

### Catch Up - Download Latest Episodes

```bash
# Get season details to see latest episode
curl "http://localhost:3001/metadata/tv/1396/season/5"

# Download last 3 episodes
curl -X POST http://localhost:3001/download/batch \
  -d '{
    "tmdbId":1396,
    "mediaType":"tv",
    "title":"Breaking Bad",
    "batchDownload":{
      "episodes":[
        {"seasonNumber":5,"episodeNumber":14},
        {"seasonNumber":5,"episodeNumber":15},
        {"seasonNumber":5,"episodeNumber":16}
      ]
    }
  }'
```

### Storage Management - Fill Gaps

You have episodes 1, 2, 4, 6 and want to fill in 3 and 5:

```bash
# List season pack files
curl -X POST http://localhost:3001/download/list-files \
  -d '{"magnetLink":"magnet:?xt=urn:btih:SEASON_PACK"}'

# Download only episodes 3 and 5 (indices 2 and 4)
curl -X POST http://localhost:3001/download/start \
  -d '{
    "id":"fill-gaps",
    "sourceType":"torrent",
    "sourceUrn":"magnet:?xt=urn:btih:SEASON_PACK",
    "fileSelection":{"fileIndices":[2,4]}
  }'
```

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/metadata/tv/:id/seasons` | GET | List all seasons |
| `/metadata/tv/:id/season/:num` | GET | Get season episodes |
| `/download/list-files` | POST | Preview torrent files |
| `/download/start` | POST | Start download (with file selection) |
| `/download/batch` | POST | Batch download episodes |
| `/download/status/:id` | GET | Check download status |
| `/events/:id` | GET | Stream progress (SSE) |

## Need Help?

- Check logs: `logs/app.log`
- Review docs: `docs/TV_SERIES_IMPLEMENTATION.md`
- Test your setup with a single episode first
- Verify ARIA2 is running: `ps aux | grep aria2`

Happy watching! 📺
