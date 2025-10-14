````markdown
```markdown
# Data Model — Chilly Movies (seed)

This document captures the primary entities and fields derived from the
feature spec. Use this as the canonical source for schema/contract generation
in Phase 1.

## MediaItem
- id: uuid
- title: string
- original_title: string (optional)
- tmdb_id: integer (optional)
- local_paths: object { video: string[], subtitles: string[] }
- poster_path: string (local)
- release_year: integer
- runtime_seconds: integer
- languages: string[]
- audio_tracks: object[] { codec, channels, language }
- subtitle_tracks: object[] { path, language, source }
- metadata_synced_at: ISO timestamp

## Library
- id: uuid
- storage_path: string
- total_size_bytes: integer
- item_count: integer
- last_indexed_at: ISO timestamp

## DownloadJob
- id: uuid
- media_item_id: uuid (nullable for arbitrary downloads)
- source_type: enum (torrent|youtube|local)
- source_urn: string (magnet|url|file)
- progress_percent: number
- speed_bytes_per_sec: number
- estimated_time_seconds: number
- status: enum (queued|active|paused|completed|failed|canceled)
- peers: object (for torrents) — optional
- error_state: object { code, message }

## UserPreferences
- id: uuid (single record)
- ui_language: enum (sw|en)
- storage_location: string
- bandwidth_limits: object { upload: number|null, download: number|null }
- auto_sync_schedule: cron-like string|null
- privacy_settings: object { telemetry_opt_in: boolean }

## MetadataSource
- name: string (e.g., TMDB)
- config: object (api_key_location, rate_limits)

```
````
