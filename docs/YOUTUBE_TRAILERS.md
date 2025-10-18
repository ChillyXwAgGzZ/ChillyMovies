# YouTube Trailer Integration

## Overview

Chilly Movies now supports viewing movie and TV show trailers directly from TMDB's YouTube integration. Users can watch trailers before deciding to download content, enhancing the discovery experience.

## Features

### 1. Trailer Fetching
- Fetches trailer videos from TMDB API
- Filters for YouTube trailers only
- Prioritizes official trailers
- Caches trailer data for 24 hours to reduce API calls

### 2. User Interface
- **Watch Trailer Button**: Available in Discovery view for each search result
- **Trailer Modal**: Full-screen modal with embedded YouTube player
- **Multiple Trailers**: If multiple trailers exist, user can switch between them
- **Trailer Types**: Displays official trailers and teasers
- **Responsive Design**: Works on all screen sizes

### 3. Offline Handling
- Gracefully degrades when offline
- Displays clear message: "Trailers require an internet connection"
- Detects online/offline status changes in real-time
- Doesn't block other app functionality when offline

### 4. Internationalization
- Fully bilingual (English & Swahili)
- All UI text translated
- Error messages localized

## API Endpoints

### GET `/metadata/:mediaType/:id/trailers`

Fetches trailer videos for a movie or TV show.

**Parameters:**
- `mediaType` (path): Either "movie" or "tv"
- `id` (path): TMDB ID of the media item

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trailer-id",
      "key": "youtube-video-key",
      "name": "Official Trailer",
      "site": "YouTube",
      "type": "Trailer",
      "official": true,
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/metadata/movie/550/trailers
```

## Usage

### For Users

1. **Search for Content**: Use the Discovery view to search for movies or TV shows
2. **Watch Trailer**: Click the "🎬 Watch Trailer" button on any result
3. **Select Trailer**: If multiple trailers are available, click on the trailer name to switch
4. **Close Modal**: Click the ✕ button or click outside the modal to close

### For Developers

#### Fetching Trailers (Backend)

```typescript
import { TMDBMetadataFetcher } from './metadata';

const metadata = new TMDBMetadataFetcher({ 
  apiKey: 'your-api-key',
  enableCache: true 
});

// Fetch trailers for a movie
const trailers = await metadata.fetchTrailers(550, 'movie'); // Fight Club

// Fetch trailers for a TV show
const trailers = await metadata.fetchTrailers(1399, 'tv'); // Game of Thrones

console.log(trailers);
```

#### Using the TrailerModal Component (Frontend)

```tsx
import { TrailerModal } from './components/TrailerModal';

function MyComponent() {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <>
      <button onClick={() => setShowTrailer(true)}>
        Watch Trailer
      </button>
      
      {showTrailer && (
        <TrailerModal
          tmdbId={550}
          mediaType="movie"
          title="Fight Club"
          onClose={() => setShowTrailer(false)}
        />
      )}
    </>
  );
}
```

## Technical Details

### Caching Strategy
- **Duration**: 24 hours (trailers don't change frequently)
- **Storage**: In-memory cache with disk persistence
- **Key Format**: `tmdb:trailers:{mediaType}:{tmdbId}`
- **Invalidation**: Can be cleared via `/metadata/cache/clear` endpoint

### Trailer Filtering & Sorting
1. **Filter**: Only YouTube trailers with type "Trailer" or "Teaser"
2. **Sort Priority**:
   - Official trailers first
   - "Trailer" type before "Teaser" type
   - Maintains TMDB's original order within each group

### YouTube Integration
- Uses YouTube embed API
- Auto-play enabled for better UX
- Related videos disabled (`rel=0`)
- Supports all YouTube embed features (fullscreen, captions, etc.)

### Offline Detection
- Listens to `online` and `offline` events
- Checks `navigator.onLine` status
- Updates UI in real-time when connectivity changes

## Configuration

### TMDB API Key

The trailer feature requires a valid TMDB API key. Set it in one of these ways:

1. **Environment Variable** (.env file):
```
TMDB_API_KEY=your_api_key_here
```

2. **Secure Storage** (recommended):
```bash
# The app will prompt you or use the settings UI
```

3. **Programmatically**:
```typescript
const metadata = new TMDBMetadataFetcher({ 
  apiKey: 'your-api-key' 
});
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "TMDB API key not configured" | No API key set | Set TMDB_API_KEY in .env or secure storage |
| "Trailers require an internet connection" | Device is offline | Connect to the internet and retry |
| "No trailers available" | TMDB has no trailers for this title | This is expected for some content |
| "Network error" | Network connectivity issue | Check internet connection |
| "TMDB API rate limit exceeded" | Too many API calls | Wait and retry, or use your own API key |

### Graceful Degradation

- When offline: Clear error message, doesn't crash the app
- When API key missing: Error thrown with clear instructions
- When no trailers found: User-friendly message displayed
- When rate limited: Uses cached data if available

## Testing

### Unit Tests

```bash
# Test trailer metadata fetching
npm test -- tests/metadata-trailers.test.ts

# Test API endpoints
npm test -- tests/api-server.test.ts
```

### Manual Testing

1. **Online Mode**:
   - Search for "Fight Club"
   - Click "Watch Trailer"
   - Verify trailer plays
   - Switch between multiple trailers (if available)

2. **Offline Mode**:
   - Disconnect from internet
   - Try to watch a trailer
   - Verify offline message displays

3. **Bilingual**:
   - Switch language to Swahili in settings
   - Verify all trailer UI is translated

## Accessibility

- ✅ Keyboard navigation supported
- ✅ ARIA labels on all buttons
- ✅ Screen reader friendly
- ✅ Clear focus indicators
- ✅ Semantic HTML structure

## Performance

- **Cache Hit**: < 10ms (memory)
- **Cache Miss + API**: ~ 200-500ms (depends on TMDB API)
- **Modal Render**: < 100ms
- **YouTube Embed Load**: ~ 1-2s (depends on YouTube)

## Future Enhancements

Potential improvements for future versions:

- [ ] Download trailers for offline viewing
- [ ] Trailer thumbnails in selection UI
- [ ] Remember last watched trailer per title
- [ ] Trailer playback in library view
- [ ] Support for non-YouTube trailers (Vimeo, etc.)
- [ ] Trailer quality selection
- [ ] Mini-player mode

## Troubleshooting

### Trailers Won't Load

1. Check TMDB API key is set:
```bash
echo $TMDB_API_KEY
```

2. Check network connectivity:
```bash
curl https://api.themoviedb.org/3
```

3. Check backend logs:
```bash
# Look for TMDB API errors in logs
tail -f logs/*.log
```

### Modal Not Closing

- Ensure you're clicking the ✕ button or clicking outside the video area
- Check browser console for JavaScript errors
- Try refreshing the page

### YouTube Embed Blocked

- Check if YouTube is accessible in your region
- Verify no browser extensions are blocking embeds
- Check Content Security Policy settings

## Related Documentation

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [YouTube Embed API](https://developers.google.com/youtube/iframe_api_reference)
- [Project README](../README.md)
- [Metadata API](./TMDB_SETUP.md)

## Support

For issues or questions:
1. Check this documentation
2. Search existing GitHub issues
3. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs if applicable

---

**Last Updated**: 2025-10-17  
**Version**: 1.0.0  
**Status**: ✅ Implemented and tested
