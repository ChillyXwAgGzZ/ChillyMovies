# Torrent Search Integration

This document describes the torrent search functionality in Chilly Movies, which enables users to discover and download movies via torrent networks.

## Overview

The torrent search module provides a unified interface for searching torrent content across multiple providers. It implements a pluggable provider pattern for extensibility and includes features like quality filtering, seeder/leecher information, and rate limiting.

## Architecture

### Components

1. **TorrentSearchManager** - Central coordinator that aggregates results from multiple providers
2. **TorrentProvider Interface** - Standard interface all providers must implement
3. **Provider Implementations** - Currently supports YTS (yts.mx)
4. **Cache Layer** - 5-minute TTL cache to reduce API calls
5. **Rate Limiting** - Per-provider rate limiting to respect API limits

### Provider Pattern

```typescript
interface TorrentProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<TorrentResult[]>;
  getDetails?(id: string): Promise<TorrentResult | null>;
  isAvailable(): Promise<boolean>;
}
```

## Supported Providers

### YTS (yts.mx)

**Focus**: Movies optimized for small file sizes
**API**: Official REST API
**Rate Limit**: 1 second between requests
**Qualities**: 720p, 1080p, 2160p (4K)

**Features**:
- High-quality movie torrents
- Multiple quality options per movie
- Detailed metadata (year, IMDB info)
- Reliable seeders
- Small file sizes

### Future Providers

**1337x** - Planned but requires HTML scraping (no official API)
**The Pirate Bay** - Planned via proxy support

## API Endpoints

### Search Torrents

```http
GET /torrents/search?q={query}&limit={num}&quality={qualities}&minSeeders={num}&providers={list}
```

**Parameters**:
- `q` (required) - Search query
- `limit` (optional) - Max results per provider (default: 20)
- `quality` (optional) - Comma-separated quality filter (e.g., "1080p,2160p")
- `minSeeders` (optional) - Minimum number of seeders
- `providers` (optional) - Comma-separated provider list (default: all)

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "yts-12345-1080p",
        "title": "The Matrix (1999)",
        "year": 1999,
        "quality": "1080p",
        "size": 1503238553,
        "sizeFormatted": "1.4 GB",
        "seeders": 150,
        "leechers": 20,
        "magnetLink": "magnet:?xt=urn:btih:ABC123...",
        "provider": "YTS",
        "type": "movie",
        "torrentUrl": "https://yts.mx/torrent/download/ABC123",
        "uploadDate": "2024-01-01 12:00:00"
      }
    ],
    "count": 1,
    "query": "The Matrix",
    "options": {}
  }
}
```

### Check Provider Status

```http
GET /torrents/providers
```

**Response**:
```json
{
  "success": true,
  "data": {
    "providers": [
      { "name": "YTS", "available": true }
    ]
  }
}
```

### Clear Cache

```http
POST /torrents/cache/clear
```

Requires API key authentication (`x-api-key` header).

## Usage Examples

### Basic Search

```typescript
import { torrentSearch } from './torrent-search';

// Simple search
const results = await torrentSearch.search('Inception');

// With options
const filteredResults = await torrentSearch.search('Inception', {
  quality: ['1080p', '2160p'],
  minSeeders: 10,
  limit: 20,
});
```

### Frontend Integration

```typescript
// In DiscoveryView.tsx
const searchTorrents = async (query: string) => {
  const response = await fetch(
    `http://localhost:3001/torrents/search?q=${encodeURIComponent(query)}&minSeeders=5`
  );
  const data = await response.json();
  
  if (data.success) {
    setTorrentResults(data.data.results);
  }
};
```

### Starting a Download

```typescript
// After user selects a torrent
const result = torrentResults[selectedIndex];

const response = await fetch('http://localhost:3001/download/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: result.id,
    sourceType: 'torrent',
    sourceUrn: result.magnetLink,
    title: result.title,
  }),
});
```

## Search Options

### Quality Filtering

```typescript
// Only HD content
const hdResults = await torrentSearch.search('Movie', {
  quality: ['1080p', '2160p'],
});
```

### Seeder Filtering

```typescript
// Only torrents with good availability
const wellSeededResults = await torrentSearch.search('Movie', {
  minSeeders: 50,
});
```

### Provider Selection

```typescript
// Search only specific providers
const ytsResults = await torrentSearch.search('Movie', {
  providers: ['YTS'],
});
```

## Caching

The search manager implements a 5-minute TTL cache:

- **Cache Key**: `{query}-{JSON.stringify(options)}`
- **TTL**: 300,000ms (5 minutes)
- **Benefits**: Reduces API calls, improves response time
- **Management**: Auto-expires or manual clear via API

```typescript
// Clear cache programmatically
torrentSearch.clearCache();
```

## Rate Limiting

Each provider implements its own rate limiting:

- **YTS**: 1 second minimum between requests
- **Mechanism**: Tracks last request time, delays if needed
- **Purpose**: Respect provider API limits, avoid blocks

## Magnet Link Format

Generated magnet links include:

```
magnet:?xt=urn:btih:{HASH}&dn={DISPLAY_NAME}&tr={TRACKER1}&tr={TRACKER2}...
```

**Components**:
- `xt` - Info hash (BitTorrent identifier)
- `dn` - Display name (URL-encoded title)
- `tr` - Tracker URLs (multiple for redundancy)

**Trackers Used**:
- udp://open.demonii.com:1337/announce
- udp://tracker.openbittorrent.com:80
- udp://tracker.coppersurfer.tk:6969
- udp://glotorrents.pw:6969/announce
- udp://tracker.opentrackr.org:1337/announce
- udp://torrent.gresille.org:80/announce
- udp://p4p.arenabg.com:1337
- udp://tracker.leechers-paradise.org:6969

## Error Handling

### Provider Unavailable

If a provider is unavailable:
1. Check returns `false` from `isAvailable()`
2. Provider is skipped for that search
3. Other providers continue normally
4. Logged as warning

### API Error

If provider API fails:
1. Catch exception in provider
2. Return empty array `[]`
3. Log error with context
4. Other providers unaffected

### Network Timeout

```typescript
const response = await fetch(url, {
  timeout: 10000, // 10 second timeout
});
```

## Adding New Providers

### 1. Implement TorrentProvider Interface

```typescript
class MyProvider implements TorrentProvider {
  name = 'MyProvider';
  private baseUrl = 'https://api.myprovider.com';
  private minInterval = 2000; // 2 seconds

  async search(query: string, options?: SearchOptions): Promise<TorrentResult[]> {
    // 1. Rate limiting
    // 2. Build API request
    // 3. Parse response
    // 4. Convert to TorrentResult format
    // 5. Return results
  }

  async isAvailable(): Promise<boolean> {
    // Test provider connectivity
  }
}
```

### 2. Register Provider

```typescript
// In torrent-search.ts constructor
constructor() {
  this.registerProvider(new YTSProvider());
  this.registerProvider(new MyProvider()); // Add here
}
```

### 3. Test Provider

```typescript
// In tests/torrent-search.test.ts
it('should search MyProvider', async () => {
  // Mock API responses
  // Test search functionality
  // Verify result format
});
```

## Best Practices

### 1. Always Filter by Seeders

```typescript
// Good: Ensures download viability
const results = await torrentSearch.search(query, { minSeeders: 10 });

// Bad: May include dead torrents
const results = await torrentSearch.search(query);
```

### 2. Respect Rate Limits

Don't bypass provider rate limits - they prevent blocks.

### 3. Cache Aggressively

Use the built-in cache, don't make redundant searches.

### 4. Handle Empty Results

```typescript
const results = await torrentSearch.search(query);
if (results.length === 0) {
  // Show "No results found" message
}
```

### 5. Validate Magnet Links

```typescript
if (!result.magnetLink.startsWith('magnet:?xt=urn:btih:')) {
  // Invalid magnet link
}
```

## Security Considerations

### 1. User Privacy

- No tracking of search queries
- No logging of downloaded content
- Magnet links processed locally

### 2. Legal Compliance

- Users responsible for content legality
- App provides search tool only
- Include terms of service
- Implement takedown process

### 3. Malware Protection

- Only use reputable providers
- Verify torrent hashes when possible
- Scan downloaded files (future feature)

## Performance Optimization

### 1. Parallel Provider Searches

```typescript
// Search all providers in parallel
const searchPromises = providers.map(p => p.search(query));
const results = await Promise.all(searchPromises);
```

### 2. Result Sorting

Results automatically sorted by seeders (descending) for best download experience.

### 3. Cache Hit Rate

Monitor cache effectiveness:
```typescript
const stats = {
  hits: 0,
  misses: 0,
  hitRate: hits / (hits + misses)
};
```

## Troubleshooting

### No Results Returned

1. Check provider availability: `GET /torrents/providers`
2. Verify network connectivity
3. Try different search terms
4. Check provider status page

### Slow Searches

1. Results are cached (5 min TTL)
2. First search per query will be slower
3. Provider rate limiting may delay responses
4. Check network latency

### Provider Blocked

1. Provider may have rate-limited your IP
2. Wait before retrying (respect rate limits)
3. Use different provider
4. Check provider's status page

## Future Enhancements

1. **More Providers** - Add 1337x, The Pirate Bay, RARBG alternatives
2. **Advanced Filtering** - Genre, year range, rating, language
3. **Torrent Health** - Calculate health score from seeders/leechers ratio
4. **User Ratings** - Integrate TMDB ratings with torrent results
5. **Smart Recommendations** - Suggest similar content
6. **Download Priority** - Auto-select best torrent based on health + quality
7. **Subtitle Integration** - Show which torrents include subtitles
8. **RSS Feeds** - Subscribe to new releases
9. **Magnet Link History** - Remember downloaded torrents
10. **Provider Failover** - Automatic fallback when provider fails

## References

- [YTS API Documentation](https://yts.mx/api)
- [BitTorrent Protocol Specification](http://www.bittorrent.org/beps/bep_0000.html)
- [Magnet URI Scheme](https://en.wikipedia.org/wiki/Magnet_URI_scheme)
- [WebTorrent Documentation](https://webtorrent.io/docs)
