# Detail Pages Enhancement Plan

## Overview
Enhance Movie and TV Series detail pages to improve readability, add more information, and create a professional streaming-app experience similar to Netflix/TMDB.

**Issue:** Current detail pages have poor contrast in light mode (black text on dark poster backgrounds) and limited metadata display.

**Goal:** Create visually balanced, highly readable, and informative detail pages that work perfectly in both light and dark themes.

---

## Problem Analysis

### Current Issues (from screenshots)

1. **Contrast Problems:**
   - Light mode: Black text on dark poster backgrounds (title, description, buttons)
   - Hard to read movie title "Captain Hook - The Cursed Tides"
   - Download and Watch Trailer buttons blend into backdrop

2. **Missing Information:**
   - No production company/studio
   - No budget/revenue information
   - No runtime
   - No status (Released, In Production, etc.)
   - No related/similar movies section
   - Limited genre display

3. **Layout Issues:**
   - Text directly overlays complex backdrop images
   - No clear visual hierarchy
   - Buttons don't stand out enough

---

## Solution Design

### 1. Text Contrast & Readability

#### Hero Section Improvements
```tsx
// Add darker gradient overlay for better text contrast
<div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40" />

// Force white text in hero section (works for both themes)
<h1 className="text-white">
<p className="text-gray-100">

// Add text shadow for extra legibility
<h1 style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
```

#### Button Enhancements
```tsx
// Download button with stronger contrast
<button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50">

// Watch Trailer button with backdrop
<button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white">
```

---

### 2. Enhanced Metadata Display

#### New Fields to Add

**For Movies:**
- Runtime (e.g., "2h 15m")
- Status (Released, In Production, Post Production, etc.)
- Budget (formatted as "$50,000,000")
- Revenue (formatted as "$250,000,000")
- Production Companies (logos or names)
- Genres (as colored pills below title)
- Original Language
- Tagline (if available)

**For TV Series:**
- Number of Seasons
- Number of Episodes
- Status (Returning Series, Ended, Cancelled, etc.)
- Episode Runtime (average)
- Networks (production networks with logos)
- Genres (as colored pills)
- First Air Date / Last Air Date
- Original Language

#### Data Structure Changes

**Update MediaMetadata interface** (src/renderer/services/api.ts):
```typescript
export interface MediaMetadata {
  id?: number | string;
  title: string;
  overview?: string;
  year?: number;
  poster?: string;
  backdrop?: string;
  voteAverage?: number;
  releaseDate?: string;
  mediaType?: "movie" | "tv";
  genreIds?: number[];
  
  // NEW FIELDS
  runtime?: number;                    // In minutes
  status?: string;                     // "Released", "Returning Series", etc.
  budget?: number;                     // In USD
  revenue?: number;                    // In USD
  productionCompanies?: {
    id: number;
    name: string;
    logoPath?: string;
  }[];
  networks?: {                         // TV only
    id: number;
    name: string;
    logoPath?: string;
  }[];
  genres?: { id: number; name: string }[]; // Full genre objects
  originalLanguage?: string;
  tagline?: string;
  numberOfSeasons?: number;            // TV only
  numberOfEpisodes?: number;           // TV only
  episodeRuntime?: number[];           // TV only (array of typical runtimes)
  lastAirDate?: string;                // TV only
}
```

---

### 3. Related Content Section

#### Design Approach
- Horizontal scrollable carousel below main content
- "Similar Movies" or "Similar TV Shows" heading
- 6-8 movie/TV cards in a row
- Scroll snapping for smooth UX
- Arrow navigation buttons (optional)

#### API Integration
TMDB provides `/movie/{id}/similar` and `/tv/{id}/similar` endpoints

**New backend endpoint** (src/api-server.ts):
```typescript
app.get("/metadata/:mediaType/:id/similar", async (req: Request, res: Response) => {
  const { mediaType, id } = req.params;
  const result = await metadata.fetchSimilar(parseInt(id), mediaType as "movie" | "tv");
  res.json({ success: true, data: result });
});
```

**New metadata method** (src/metadata.ts):
```typescript
async fetchSimilar(tmdbId: number, mediaType: "movie" | "tv"): Promise<MediaMetadata[]> {
  const url = `${this.baseUrl}/${mediaType}/${tmdbId}/similar?api_key=${this.apiKey}&page=1`;
  // ... fetch and map results
}
```

---

### 4. Layout Redesign

#### New Structure

```
┌─────────────────────────────────────────────────┐
│ Back Button                                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │      HERO BANNER (Backdrop + Gradient)    │  │
│  │  ┌────────┐                               │  │
│  │  │ Poster │  Title (White, Large)         │  │
│  │  │        │  Year • Rating • Runtime      │  │
│  │  │        │  [Genre Pills]                │  │
│  │  └────────┘  Description (White/Gray)     │  │
│  │              [Download] [Watch Trailer]   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ METADATA GRID                             │  │
│  │ ┌────────────┐ ┌────────────┐            │  │
│  │ │ Status     │ │ Budget     │            │  │
│  │ │ Released   │ │ $50M       │            │  │
│  │ └────────────┘ └────────────┘            │  │
│  │ ┌────────────┐ ┌────────────┐            │  │
│  │ │ Revenue    │ │ Studios    │            │  │
│  │ │ $250M      │ │ Disney...  │            │  │
│  │ └────────────┘ └────────────┘            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ SIMILAR MOVIES                            │  │
│  │ ◀ [Card][Card][Card][Card][Card][Card] ▶ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### Visual Enhancements
- Poster: Larger (w-72 instead of w-64), better shadow
- Title: Larger font (text-5xl md:text-6xl), white with text shadow
- Metadata badges: Glass morphism style (backdrop-blur, subtle borders)
- Genre pills: Colored backgrounds matching genre types
- Spacing: More breathing room, clear sections
- Animations: Subtle fade-in effects, hover states

---

## Implementation Tasks

### Phase 1: Backend Enhancements (3 hours)

#### T-DETAIL-001: Extend TMDB data fetching (1.5h)
**File:** `src/metadata.ts`
- Update `fetchByTMDBId` to map additional TMDB fields:
  - `runtime`, `status`, `budget`, `revenue`
  - `production_companies` (with logos)
  - `networks` (TV only)
  - `genres` (full objects with names)
  - `tagline`, `original_language`
  - `number_of_seasons`, `number_of_episodes` (TV only)
  - `episode_run_time` (TV only)
  - `last_air_date` (TV only)
- Test with console logging to verify all fields

#### T-DETAIL-002: Add similar content endpoint (1h)
**Files:** `src/metadata.ts`, `src/api-server.ts`
- Create `fetchSimilar()` method in TMDBMetadataProvider
- Add `GET /metadata/:mediaType/:id/similar` endpoint
- Add caching (30 min TTL)
- Test with curl/Postman

#### T-DETAIL-003: Update type definitions (0.5h)
**Files:** `src/renderer/services/api.ts`, `src/types.ts`
- Update `MediaMetadata` interface with new fields
- Add proper TypeScript types for companies, networks
- Ensure backend and frontend types align

---

### Phase 2: Frontend UI Enhancements (4 hours)

#### T-DETAIL-004: Fix text contrast in hero section (1h)
**Files:** `MovieDetailView.tsx`, `TVDetailView.tsx`
- Darken backdrop gradient overlay (from-black via-black/85)
- Force white text for title and description
- Add text shadows (0 2px 8px rgba(0,0,0,0.8))
- Update button styles:
  - Download: Strong indigo with shadow
  - Watch Trailer: Glass morphism (bg-white/10 backdrop-blur)
- Test in both light and dark modes
- Verify with screenshots

#### T-DETAIL-005: Create metadata info grid (1.5h)
**Files:** `MovieDetailView.tsx`, `TVDetailView.tsx`
- Create `MetadataCard` component (reusable card with label/value)
- Add 2x2 grid below hero section
- Display:
  - Movies: Status, Budget, Revenue, Runtime, Production Companies
  - TV: Status, Seasons, Episodes, Networks, Episode Runtime
- Format numbers (e.g., "$50M" for budget, "2h 15m" for runtime)
- Add studio/network logos where available
- Style with glass morphism cards

#### T-DETAIL-006: Add genre pills to hero (0.5h)
**Files:** `MovieDetailView.tsx`, `TVDetailView.tsx`
- Display genres as colored pills below title
- Use genre ID to name mapping (or fetch from new `genres` field)
- Colored backgrounds: Action=red, Comedy=yellow, Drama=blue, etc.
- Horizontal scrollable if many genres
- Add to both movie and TV views

#### T-DETAIL-007: Create similar content carousel (1h)
**Files:** `MovieDetailView.tsx`, `TVDetailView.tsx`, `SimilarContent.tsx` (new)
- Create `SimilarContent` component
- Fetch similar items using `metadataApi.getSimilar(id, mediaType)`
- Horizontal scroll container (overflow-x-auto scroll-smooth snap-x)
- Display 6-8 MovieCard components
- Add "Similar Movies"/"Similar TV Shows" heading
- Optional: Add arrow navigation buttons
- Handle loading and error states

---

### Phase 3: Polish & Testing (1.5 hours)

#### T-DETAIL-008: Add animations and transitions (0.5h)
**Files:** `MovieDetailView.tsx`, `TVDetailView.tsx`
- Fade-in animation for main content (opacity + translateY)
- Hover effects on metadata cards
- Smooth scroll behavior for carousel
- Loading skeleton screens (optional)

#### T-DETAIL-009: Test responsiveness (0.5h)
- Test on mobile (320px, 375px, 414px widths)
- Test on tablet (768px, 1024px)
- Test on desktop (1440px, 1920px)
- Ensure poster scales properly
- Verify carousel works on mobile (touch scroll)
- Test both light and dark themes

#### T-DETAIL-010: Final QA and screenshots (0.5h)
- Test all contrast fixes in light mode
- Verify all metadata fields display correctly
- Test similar content carousel
- Take before/after screenshots
- Verify no TypeScript errors
- Check console for warnings

---

## Technical Specifications

### Color Palette for Genres
```typescript
const genreColors: Record<number, string> = {
  28: "bg-red-500/80",        // Action
  12: "bg-amber-500/80",      // Adventure
  16: "bg-purple-500/80",     // Animation
  35: "bg-yellow-500/80",     // Comedy
  80: "bg-gray-700/80",       // Crime
  99: "bg-teal-500/80",       // Documentary
  18: "bg-blue-500/80",       // Drama
  10751: "bg-green-500/80",   // Family
  14: "bg-indigo-500/80",     // Fantasy
  27: "bg-red-800/80",        // Horror
  9648: "bg-purple-800/80",   // Mystery
  10749: "bg-pink-500/80",    // Romance
  878: "bg-cyan-500/80",      // Sci-Fi
  53: "bg-orange-700/80",     // Thriller
  // ... add more as needed
};
```

### Number Formatting Utilities
```typescript
function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
```

### Glass Morphism Button Styles
```typescript
const glassMorphismButton = `
  bg-white/10 
  hover:bg-white/20 
  backdrop-blur-sm 
  border border-white/30 
  text-white 
  shadow-lg 
  transition-all 
  hover:scale-105
`;
```

---

## API Endpoints Summary

### Existing
- `GET /metadata/:mediaType/:id` - Get basic details
- `GET /metadata/:mediaType/:id/trailers` - Get trailers

### New
- `GET /metadata/:mediaType/:id/similar` - Get similar content

### TMDB API Fields (Available but Not Currently Used)

**Movies:**
- `runtime` (integer, minutes)
- `status` (string: Released, In Production, etc.)
- `budget` (integer, USD)
- `revenue` (integer, USD)
- `production_companies` (array of {id, name, logo_path})
- `genres` (array of {id, name})
- `tagline` (string)
- `original_language` (string)
- `spoken_languages` (array)
- `production_countries` (array)

**TV Series:**
- `number_of_seasons` (integer)
- `number_of_episodes` (integer)
- `status` (string: Returning Series, Ended, etc.)
- `networks` (array of {id, name, logo_path})
- `episode_run_time` (array of integers)
- `last_air_date` (string)
- `genres` (array of {id, name})
- `original_language` (string)
- `production_companies` (array)

---

## Acceptance Criteria

### Must Have
- ✅ Title and description readable in both light and dark modes
- ✅ Strong contrast between text and background (WCAG AA compliant)
- ✅ Display runtime, status, budget, revenue (movies)
- ✅ Display seasons, episodes, status (TV shows)
- ✅ Similar content carousel below main content
- ✅ Production companies/networks with logos
- ✅ Genre pills below title

### Nice to Have
- Glass morphism effects on buttons and cards
- Animated transitions
- Loading skeletons
- Network/studio logo images (may not always be available)
- Tagline display

### Performance
- Similar content should load asynchronously (don't block main content)
- Cache TMDB responses appropriately
- Images should lazy load

---

## Estimated Timeline

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Backend Enhancements | T-DETAIL-001 to T-DETAIL-003 | 3h | High |
| Frontend UI | T-DETAIL-004 to T-DETAIL-007 | 4h | High |
| Polish & Testing | T-DETAIL-008 to T-DETAIL-010 | 1.5h | Medium |
| **Total** | **10 tasks** | **8.5h** | - |

---

## Testing Checklist

- [ ] Light mode: Title readable on dark backdrops
- [ ] Light mode: Buttons clearly visible
- [ ] Dark mode: All elements still look good
- [ ] Movies show budget, revenue, runtime, status
- [ ] TV shows show seasons, episodes, networks
- [ ] Similar content carousel loads and scrolls smoothly
- [ ] Genre pills display with proper colors
- [ ] Production company logos render (when available)
- [ ] Mobile responsive (320px - 768px)
- [ ] Tablet responsive (768px - 1024px)
- [ ] Desktop responsive (1440px+)
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Loading states display properly
- [ ] Error states handle gracefully

---

## Related Files

### Backend
- `src/metadata.ts` - TMDB integration
- `src/api-server.ts` - API endpoints
- `src/types.ts` - Type definitions

### Frontend
- `src/renderer/views/MovieDetailView.tsx`
- `src/renderer/views/TVDetailView.tsx`
- `src/renderer/services/api.ts` - API client
- `src/renderer/components/MovieCard.tsx` - Reuse for similar content

### New Components
- `src/renderer/components/SimilarContent.tsx` - Carousel for related items
- `src/renderer/components/MetadataCard.tsx` - Info card for details grid

---

## Design References

**Inspiration:**
- Netflix detail pages (clean hierarchy, strong contrast)
- TMDB website (comprehensive metadata)
- Disney+ (glass morphism effects)
- Apple TV+ (elegant typography)

**Key Principles:**
- Readability first (contrast is king)
- Information density without clutter
- Smooth interactions and animations
- Theme consistency (light/dark)
- Mobile-first responsive design

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TMDB API rate limits | Medium | Aggressive caching (6h TTL for details) |
| Missing budget/revenue data | Low | Only show fields when data exists |
| Logo images not available | Low | Fallback to text-only company names |
| Large similar content payload | Low | Limit to 12 items, paginate if needed |
| Complex layout on small screens | Medium | Stack vertically on mobile, simplify grid |

---

## Future Enhancements (Out of Scope)

- [ ] Cast and crew information with photos
- [ ] User reviews integration
- [ ] Ratings from multiple sources (IMDB, Rotten Tomatoes)
- [ ] "Where to Watch" streaming availability
- [ ] Collection/franchise information (e.g., MCU, Star Wars)
- [ ] Season-by-season breakdowns for TV
- [ ] Watchlist / Favorites functionality

---

## Success Metrics

- User can read all text in light mode without straining
- Detail pages load within 1 second (cached)
- Similar content engages users to explore more
- Zero contrast-related bug reports
- Positive feedback on visual design

---

**Created:** 2025-01-22  
**Status:** Ready for Implementation  
**Approved By:** [User]  
**Next Action:** Begin T-DETAIL-001 (Extend TMDB data fetching)
