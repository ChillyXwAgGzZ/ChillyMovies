# Library Migration Guide

This document describes how to migrate your Chilly Movies library data between versions or installations.

## Export Format

The library export format is a JSON file with the following structure:

```json
{
  "version": "1.0.0",
  "exportDate": "2025-10-17T12:00:00.000Z",
  "itemCount": 100,
  "items": [
    {
      "id": "movie-123",
      "title": "The Matrix",
      "metadata": {
        "tmdbId": 603,
        "year": 1999,
        "overview": "A computer hacker learns...",
        "poster": "https://image.tmdb.org/t/p/w500/...",
        "voteAverage": 8.7
      },
      "createdAt": "2025-10-15T10:30:00.000Z",
      "hasMediaFile": true,
      "mediaFilePath": "/path/to/media/movie-123.mp4"
    }
  ]
}
```

### Fields

- **version**: Export format version (currently "1.0.0")
- **exportDate**: ISO 8601 timestamp when export was created
- **itemCount**: Total number of items in the export
- **items**: Array of media items

#### Item Fields

- **id**: Unique identifier for the media item
- **title**: Display title
- **metadata**: TMDB metadata (variable structure)
- **createdAt**: When the item was added to library
- **hasMediaFile**: Whether media file exists (boolean)
- **mediaFilePath**: Full path to media file (if exists)

## Exporting Your Library

### Via API

```bash
curl http://localhost:3001/library/export -o library-backup.json
```

### Via Code

```typescript
import { exportLibraryToFile } from './src/export-import';
import { StorageManager } from './src/storage';

const storage = new StorageManager();
await exportLibraryToFile(storage, './backup.json');
```

## Importing Library Data

### Via API

```bash
curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d @library-backup.json
```

### Via Code

```typescript
import { importLibraryFromFile } from './src/export-import';
import { StorageManager } from './src/storage';

const storage = new StorageManager();
const result = await importLibraryFromFile(storage, './backup.json', {
  overwrite: false,    // Don't overwrite existing items
  skipExisting: true,  // Skip items that already exist
  validateFiles: false // Don't validate media file paths
});

console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
```

### Import Options

- **overwrite**: Replace existing items with imported data (default: false)
- **skipExisting**: Skip items that already exist (default: true)
- **validateFiles**: Check if media files exist before importing (default: false)

## Backup and Restore

### Creating Backups

Backups are stored in the `backups/` directory with timestamps:

```bash
# Via API
curl -X POST http://localhost:3001/library/backup \
  -H "x-api-key: YOUR_API_KEY"

# Returns: { "success": true, "data": { "backupPath": "./backups/library-backup-2025-10-17T12-00-00-000Z.json" }}
```

### Listing Backups

```bash
curl http://localhost:3001/library/backups
```

Returns backups in reverse chronological order (most recent first).

### Restoring from Backup

```bash
curl -X POST http://localhost:3001/library/restore \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "backupPath": "./backups/library-backup-2025-10-17T12-00-00-000Z.json",
    "options": {
      "overwrite": false,
      "skipExisting": true
    }
  }'
```

## Migration Scenarios

### Scenario 1: Moving to a New Computer

1. **On old computer**:
   ```bash
   # Export library
   curl http://localhost:3001/library/export -o library.json
   
   # Copy library.json and media/ directory to new computer
   ```

2. **On new computer**:
   ```bash
   # Install Chilly Movies
   # Copy media files to media directory
   
   # Import library
   curl -X POST http://localhost:3001/library/import \
     -H "Content-Type: application/json" \
     -d @library.json
   ```

### Scenario 2: Merging Two Libraries

```bash
# Export from both installations
curl http://computer1:3001/library/export -o library1.json
curl http://computer2:3001/library/export -o library2.json

# Import to new installation with skipExisting=true
curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -d @library1.json

curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -d @library2.json
```

### Scenario 3: Recovering from Corruption

```bash
# List backups
curl http://localhost:3001/library/backups

# Restore from most recent backup
curl -X POST http://localhost:3001/library/restore \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "backupPath": "./backups/library-backup-2025-10-17T10-00-00-000Z.json",
    "options": { "overwrite": true }
  }'
```

## Storage Backend Migration

### From JSON to SQLite

If migrating from JSON fallback storage to SQLite:

1. Export library with current storage backend
2. Install/enable SQLite (`better-sqlite3`)
3. Restart application (will create SQLite database)
4. Import the exported data

```bash
# With JSON backend
curl http://localhost:3001/library/export -o migration.json

# After enabling SQLite
curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -d @migration.json
```

### From SQLite to JSON

Same process, but in reverse:

```bash
# With SQLite backend
curl http://localhost:3001/library/export -o migration.json

# After disabling better-sqlite3
curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -d @migration.json
```

## Validation

Before importing, validate the export format:

```bash
curl -X POST http://localhost:3001/library/import/validate \
  -H "Content-Type: application/json" \
  -d @library.json
```

Returns:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "version": "1.0.0",
    "itemCount": 100
  }
}
```

## Best Practices

1. **Regular Backups**: Create backups before major operations
2. **Test Imports**: Validate format before importing large datasets
3. **Media Files**: Keep media files in sync with metadata
4. **Version Compatibility**: Check export format version matches importer
5. **Incremental Imports**: Use `skipExisting: true` to avoid duplicates

## Troubleshooting

### Import Fails with "Invalid JSON format"

The export file is corrupted. Try:
- Re-export from source
- Validate JSON syntax with `jq` or similar tool

### Items Skipped During Import

Items already exist in database. Use `overwrite: true` to replace them:

```bash
curl -X POST http://localhost:3001/library/import \
  -H "Content-Type: application/json" \
  -d '{
    "data": <library-data>,
    "options": { "overwrite": true, "skipExisting": false }
  }'
```

### Media Files Not Found

The `mediaFilePath` in export points to old location. Either:
- Move media files to expected location
- Use `validateFiles: false` option
- Update paths manually in JSON before importing

## Format Versioning

Current version: **1.0.0**

Future versions will maintain backward compatibility. The importer checks the version field and applies appropriate transformations.

### Version History

- **1.0.0** (2025-10-17): Initial export format
  - Basic metadata export
  - Media file path tracking
  - Backup/restore functionality
