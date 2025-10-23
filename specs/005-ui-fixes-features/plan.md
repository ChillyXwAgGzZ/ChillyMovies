# Implementation Plan: UI Fixes & Features Enhancement

**Branch**: `004-004-theme-fetch` | **Date**: 2025-10-22 | **Phase**: 3 (Detail Pages Enhancement)
**Input**: User feedback from screenshots + enhancement requirements

## Summary

This specification implements comprehensive UI fixes and feature enhancements for ChillyMovies, organized into 7 phases. **Phase 3 (Detail Pages Enhancement)** focuses on improving Movie and TV Series detail pages with better contrast, comprehensive metadata display, and related content recommendations.

**Current Status**: Phase 1 ✅ Complete (6 tasks), Phase 2 🔄 In Progress (4/6 tasks complete), **Phase 3 🚀 Starting Implementation**

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 18 LTS  
**Primary Dependencies**: React 18.3, Electron 28.3, Vite 5.4, TailwindCSS 3.4  
**API Integration**: TMDB API v3 (metadata provider)  
**Storage**: LocalStorage (filter state), SessionStorage (scroll position), JSON file (download state)  
**Testing**: Vitest, React Testing Library  
**Target Platform**: Electron (cross-platform desktop: Windows, macOS, Linux)  
**Project Type**: Hybrid (Electron main + React renderer)  
**Performance Goals**: Page load <1s (cached), API response <500ms, smooth 60fps scrolling  
**Constraints**: TMDB API rate limits (40 req/10s), offline-capable where possible  
**Scale/Scope**: ~5K LOC for UI layer, ~30 components, 10 views

## Constitution Check

*GATE: Passed before Phase 0. Re-checked after Phase 1 design.*

### Applicable Principles

1. **Desktop-First**: ✅ All enhancements maintain Electron-first architecture
   - Detail pages render within Electron window
   - No web-specific dependencies introduced
   - Local caching for offline capability

2. **Accessibility**: ⚠️ Requires follow-up
   - Contrast fixes improve WCAG AA compliance (text readability)
   - Keyboard navigation for carousels needed (Phase 3)
   - Screen reader labels for metadata cards (Phase 3)
   - **Follow-up**: Accessibility audit after Phase 3 implementation

3. **Modular Architecture**: ✅ Maintained
   - Reusable components: `SimilarContent.tsx`, `MetadataCard.tsx`
   - Shared API client (`metadataApi`)
   - Type-safe interfaces across frontend/backend

4. **Security & Privacy**: ✅ No impact
   - No new authentication/authorization changes
   - TMDB API key remains server-side
   - No user data collection

5. **Legal & Ethical Compliance**: ✅ Compliant
   - TMDB API usage follows ToS
   - Metadata properly attributed to TMDB
   - Copyright notices maintained

### Deviations/Tradeoffs
- **TMDB API Rate Limits**: Accepted tradeoff for comprehensive metadata
  - Mitigation: Aggressive caching (6h TTL for details, 30min for similar content)
- **Missing Metadata**: Some movies/TV shows lack budget/revenue data
  - Solution: Conditionally render fields only when data exists

### Required Follow-ups
- [ ] Accessibility audit for Phase 3 components (keyboard nav, ARIA labels)
- [ ] Performance testing with large similar content datasets (>20 items)
- [ ] Manual QA for contrast ratios in both light and dark themes

## Project Structure

### Documentation (this feature)

```
specs/005-ui-fixes-features/
├── plan.md                           # This file (Phase overview + constitution)
├── detail-pages-enhancement-plan.md  # Phase 3 detailed design doc
├── tasks.md                          # All phases task breakdown (31 tasks)
└── REPORT.md                         # Progress tracking + screenshots
```

### Source Code (repository root)

```
src/
├── renderer/                         # Frontend (React)
│   ├── views/
│   │   ├── MovieDetailView.tsx       # 🔄 Phase 3: Enhance with metadata grid + similar content
│   │   ├── TVDetailView.tsx          # 🔄 Phase 3: Enhance with metadata grid + similar content
│   │   ├── MoviesView.tsx            # ✅ Phase 2: Complete (T008)
│   │   └── TVSeriesView.tsx          # ✅ Phase 2: Complete (T011)
│   ├── components/
│   │   ├── FilterPanel.tsx           # ✅ Phase 2: Complete (T009)
│   │   ├── MovieCard.tsx             # Reusable for similar content
│   │   ├── SimilarContent.tsx        # 🆕 Phase 3: Horizontal carousel (T-DETAIL-007)
│   │   └── MetadataCard.tsx          # 🆕 Phase 3: Info card component (T-DETAIL-005)
│   └── services/
│       └── api.ts                    # 🔄 Phase 3: Update MediaMetadata interface (T-DETAIL-003)
├── metadata.ts                       # 🔄 Phase 3: Extend TMDB data fetching (T-DETAIL-001)
├── api-server.ts                     # 🔄 Phase 3: Add similar endpoint (T-DETAIL-002)
└── types.ts                          # 🔄 Phase 3: Update type definitions (T-DETAIL-003)

tests/
├── integration/
│   └── detail-pages.test.ts          # 🆕 Phase 3: Integration tests for enhanced pages
└── components/
    ├── similar-content.test.tsx      # 🆕 Phase 3: Unit tests for carousel
    └── metadata-card.test.tsx        # 🆕 Phase 3: Unit tests for info cards
```

---

## Phase Overview

### ✅ Phase 1: Critical Bugs & Rendering Issues (COMPLETE)
**Status**: All 6 tasks complete (T001-T006)  
**Duration**: ~5 hours  
**Commits**: 6 commits on branch `004-004-theme-fetch`

**Key Achievements**:
- Fixed sidebar collapse button rendering (i18n translations)
- Fixed download panel button contrast in light mode
- Changed "Start" to "Download" labels
- Improved torrent auto-selection (smallest torrent by default)
- Added full torrent details display before download
- Implemented per-episode quality selection for TV series

**Files Modified**: `Sidebar.tsx`, `DownloadPanel.tsx`, `EpisodeSelector.tsx`, `i18n.ts`

---

### 🔄 Phase 2: Movies & TV Listing Pages (IN PROGRESS)
**Status**: 4/6 tasks complete (T007-T012)  
**Duration**: ~10.5 hours (8h spent)  
**Commits**: 4 commits

**Completed**:
- ✅ T007: Sidebar navigation with Movies/TV tabs
- ✅ T008: MoviesView with infinite scroll (5-column grid)
- ✅ T009: FilterPanel (collapsible top bar, genre/rating/year/sort filters)
- ✅ T011: TVSeriesView with infinite scroll (2-5 column responsive grid)

**Remaining**:
- ⏭️ T010: Movie card badges (genre/year/rating) - Deferred per user request
- 📋 T012: Adapt FilterPanel for TV (likely already complete - supports `mediaType` prop)

**Files Created**: `MoviesView.tsx`, `TVSeriesView.tsx`, `FilterPanel.tsx`  
**Files Modified**: `Sidebar.tsx`, `App.tsx`, `i18n.ts`

---

### 🚀 Phase 3: Detail Pages Enhancement (STARTING NOW)
**Status**: 0/10 tasks (T-DETAIL-001 to T-DETAIL-010)  
**Duration**: ~8.5 hours estimated  
**Goal**: Fix contrast issues, add comprehensive metadata, implement similar content carousel

#### Sub-Phases

##### 3.1 Backend Enhancements (3 hours)

**T-DETAIL-001: Extend TMDB data fetching** [1.5h] [P1]
- File: `src/metadata.ts`
- Update `fetchByTMDBId()` to map additional TMDB API fields:
  - `runtime`, `status`, `budget`, `revenue`
  - `production_companies` (array with logos)
  - `networks` (TV only)
  - `genres` (full objects: `{id, name}`)
  - `tagline`, `original_language`
  - `number_of_seasons`, `number_of_episodes` (TV only)
  - `episode_run_time` (TV only)
  - `last_air_date` (TV only)
- Add console logging to verify all fields fetched
- Test with Movie ID: 299536 (Avengers: Infinity War) and TV ID: 1399 (Game of Thrones)

**T-DETAIL-002: Add similar content endpoint** [1h] [P1]
- Files: `src/metadata.ts`, `src/api-server.ts`
- Create `fetchSimilar(tmdbId: number, mediaType: "movie" | "tv"): Promise<MediaMetadata[]>`
  - URL: `${baseUrl}/${mediaType}/${tmdbId}/similar?api_key=${apiKey}&page=1`
  - Map results to `MediaMetadata[]` (limit to 12 items)
  - Cache for 30 minutes (similar content doesn't change often)
- Add API endpoint: `GET /metadata/:mediaType/:id/similar`
- Test: `curl http://localhost:3000/metadata/movie/299536/similar`

**T-DETAIL-003: Update type definitions** [0.5h] [P1]
- Files: `src/renderer/services/api.ts`, `src/types.ts`
- Extend `MediaMetadata` interface with new fields:
  ```typescript
  runtime?: number;
  status?: string;
  budget?: number;
  revenue?: number;
  productionCompanies?: { id: number; name: string; logoPath?: string }[];
  networks?: { id: number; name: string; logoPath?: string }[];
  genres?: { id: number; name: string }[];
  originalLanguage?: string;
  tagline?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  episodeRuntime?: number[];
  lastAirDate?: string;
  ```
- Ensure backend `MediaMetadata` in `src/types.ts` matches frontend
- Update `api.ts` `getSimilar()` method signature

##### 3.2 Frontend UI Enhancements (4 hours)

**T-DETAIL-004: Fix text contrast in hero section** [1h] [P0] **← START HERE**
- Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
- **Problem**: Black text on dark poster backgrounds in light mode
- **Fix**:
  - Darken gradient overlay: `from-black via-black/85 to-black/40`
  - Force white text: `text-white` for title, `text-gray-100` for description
  - Add text shadows: `style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}`
  - Update Download button: `bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50`
  - Update Watch Trailer button: `bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white`
- **Test**: Toggle light mode, verify title/description/buttons readable on dark backdrops
- **Acceptance**: Screenshot showing "Captain Hook - The Cursed Tides" title clearly readable in light mode

**T-DETAIL-005: Create metadata info grid** [1.5h] [P1]
- Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
- Create `MetadataCard` component (reusable):
  ```tsx
  interface MetadataCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }
  ```
- Add 2x2 grid below hero section (below action buttons)
- **Movies**: Display Status, Runtime, Budget, Revenue, Production Companies
- **TV Shows**: Display Status, Seasons, Episodes, Networks, Episode Runtime
- Format numbers with utility functions:
  - `formatCurrency(50000000)` → "$50M"
  - `formatRuntime(135)` → "2h 15m"
- Style: Glass morphism cards (`bg-white/5 dark:bg-white/10 backdrop-blur border border-white/20`)
- Show production company/network logos if available (TMDB provides `logo_path`)
- Conditional rendering: Only show fields when data exists

**T-DETAIL-006: Add genre pills to hero** [0.5h] [P1]
- Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
- Display genres as colored pills below title
- Genre color mapping (subset example):
  ```typescript
  const genreColors: Record<number, string> = {
    28: "bg-red-500/80",      // Action
    35: "bg-yellow-500/80",   // Comedy
    18: "bg-blue-500/80",     // Drama
    27: "bg-red-800/80",      // Horror
    // ... 24 more genres
  };
  ```
- Layout: Horizontal flex wrap, max 6 genres visible
- Scrollable if more than 6 genres (overflow-x-auto)
- Style: Rounded pills with white text, backdrop blur

**T-DETAIL-007: Create similar content carousel** [1h] [P1]
- Files: New component `src/renderer/components/SimilarContent.tsx`
- Props: `mediaType: "movie" | "tv"`, `currentId: number`
- Fetch: `metadataApi.getSimilar(currentId, mediaType)`
- Layout: Horizontal scroll container
  - CSS: `overflow-x-auto scroll-smooth snap-x snap-mandatory`
  - Grid: `flex gap-4`, each card `min-w-[200px] snap-start`
- Display: 6-8 `MovieCard` components (reuse existing component)
- Heading: "Similar Movies" or "Similar TV Shows"
- Loading: Skeleton cards during fetch
- Error: Silent fail if no similar content (don't block page render)
- Position: Below metadata grid, full width

##### 3.3 Polish & Testing (1.5 hours)

**T-DETAIL-008: Add animations and transitions** [0.5h] [P2]
- Files: `MovieDetailView.tsx`, `TVDetailView.tsx`, `SimilarContent.tsx`
- Fade-in animation for main content:
  ```tsx
  <div className="animate-fade-in">
  // Add to tailwind.config.js if needed
  ```
- Hover effects on metadata cards (scale-105 transform)
- Smooth scroll for similar content carousel
- Optional: Loading skeleton screens for hero section

**T-DETAIL-009: Test responsiveness** [0.5h] [P1]
- Test breakpoints: 320px, 375px, 768px, 1024px, 1440px, 1920px
- Mobile: Poster and info should stack vertically
- Tablet: 2-3 columns for metadata grid
- Desktop: Full layout with 4-column metadata grid
- Carousel: Touch scroll on mobile, mouse drag on desktop
- Verify both light and dark themes at all breakpoints

**T-DETAIL-010: Final QA and screenshots** [0.5h] [P1]
- Test all contrast fixes in light mode (Captain Hook movie as baseline)
- Verify all metadata fields display correctly (test with multiple movies/TV shows)
- Test similar content carousel (horizontal scroll, click navigation)
- Take before/after screenshots
- Verify TypeScript 0 errors (`npm run typecheck`)
- Check console for warnings/errors
- Manual test: Navigate from Movies list → Movie detail → Similar movie → Detail

---

### 📋 Phase 4: Search UX Enhancement (PENDING)
**Status**: Not started (T017-T019)  
**Duration**: ~5.5 hours  
**Goal**: Inline typeahead search without page navigation

---

### 🎨 Phase 5: Visual Consistency & Theme Polish (PENDING)
**Status**: Not started (T020-T023)  
**Duration**: ~6.5 hours  
**Goal**: Audit and fix all remaining hardcoded dark styles

---

### ✅ Phase 6: Testing & Quality Assurance (PENDING)
**Status**: Not started (T024-T028)  
**Duration**: ~9 hours  
**Goal**: Unit tests, integration tests, manual QA

---

### 📊 Phase 7: Build, Report & Iteration (PENDING)
**Status**: Not started (T029-T031)  
**Duration**: ~2 hours  
**Goal**: Final dev build, documentation, status report

---

## Implementation Strategy for Phase 3

### Day 1: Backend Foundation (3 hours)
**Morning Session**:
1. T-DETAIL-001: Extend TMDB data fetching (1.5h)
   - Update `fetchByTMDBId()` in `metadata.ts`
   - Add mapping for all new fields
   - Test with console.log to verify data

2. T-DETAIL-002: Add similar content endpoint (1h)
   - Create `fetchSimilar()` method
   - Add API route in `api-server.ts`
   - Test with curl

**Afternoon Session**:
3. T-DETAIL-003: Update type definitions (0.5h)
   - Extend `MediaMetadata` interface
   - Ensure type safety across frontend/backend

**Checkpoint**: Backend ready, API tested, types aligned

### Day 2: Frontend UI Core (4 hours)
**Morning Session**:
4. T-DETAIL-004: Fix text contrast (1h) **← CRITICAL PATH**
   - Update gradients in both detail views
   - Force white text, add shadows
   - Update button styles
   - Test in light mode

**Afternoon Session**:
5. T-DETAIL-005: Create metadata grid (1.5h)
   - Build `MetadataCard` component
   - Add 2x2 grid to detail views
   - Format numbers with utility functions
   - Conditional rendering

6. T-DETAIL-006: Add genre pills (0.5h)
   - Map genre IDs to colors
   - Render pills below title
   - Horizontal scroll if needed

7. T-DETAIL-007: Similar content carousel (1h)
   - Create `SimilarContent` component
   - Horizontal scroll layout
   - Fetch and display similar items

**Checkpoint**: Detail pages visually complete, all metadata displayed

### Day 3: Polish & QA (1.5 hours)
**Morning Session**:
8. T-DETAIL-008: Add animations (0.5h)
   - Fade-in effects
   - Hover states
   - Smooth scrolling

9. T-DETAIL-009: Test responsiveness (0.5h)
   - Mobile, tablet, desktop breakpoints
   - Both themes

10. T-DETAIL-010: Final QA (0.5h)
    - Screenshot all pages
    - Verify TypeScript errors
    - Manual testing flow

**Checkpoint**: Phase 3 complete, ready for user review

---

## Technical Decisions & Rationale

### Why Extend TMDB Data Instead of New API?
**Decision**: Fetch additional fields from existing TMDB movie/TV detail endpoints  
**Rationale**:
- TMDB already provides all needed fields in single request
- No new API integration required
- Maintains existing caching strategy
- Type-safe with existing `MediaMetadata` interface

**Alternative Considered**: Scrape additional data from IMDb/Wikipedia  
**Rejected**: Legal/ethical concerns, unreliable, requires new dependencies

### Why Horizontal Carousel for Similar Content?
**Decision**: Use CSS horizontal scroll (overflow-x-auto) for similar content  
**Rationale**:
- Native browser scrolling (no library needed)
- Works on mobile (touch scroll) and desktop (mouse drag)
- Lightweight, performant
- Consistent with Netflix/streaming app patterns

**Alternative Considered**: Paginated grid with "Load More" button  
**Rejected**: Less engaging, requires extra clicks, breaks flow

### Why Glass Morphism for Metadata Cards?
**Decision**: Use backdrop-blur and semi-transparent backgrounds  
**Rationale**:
- Modern aesthetic (matches Apple TV+, Disney+)
- Works on light and dark themes
- Subtle depth without heavy shadows
- CSS-only (no images required)

**Alternative Considered**: Solid colored cards with shadows  
**Rejected**: Less elegant, harder to theme

### Why Force White Text in Hero Section?
**Decision**: Hardcode `text-white` instead of theme-aware colors  
**Rationale**:
- Hero section always has dark backdrop (even in light mode)
- White text universally readable on dark backgrounds
- Simplifies contrast logic (no conditional classes needed)
- Matches user requirement: "Use white or light-colored text over dark backgrounds"

**Alternative Considered**: Dynamic text color based on backdrop brightness  
**Rejected**: Over-engineering, unnecessary complexity

---

## Risk Mitigation

### Risk 1: TMDB API Rate Limits
**Impact**: High (could block all metadata fetching)  
**Probability**: Medium (40 requests per 10 seconds)  
**Mitigation**:
- Aggressive caching (6h for details, 30min for similar)
- Debounce rapid navigation (prevent spam requests)
- Display cached data even if refresh fails
- Fallback: Show partial data if some fields fail to load

### Risk 2: Missing Metadata Fields
**Impact**: Low (UI degrades gracefully)  
**Probability**: High (many older movies lack budget/revenue)  
**Mitigation**:
- Conditional rendering: Only show fields when data exists
- No "N/A" placeholders (cleaner UX)
- Document known limitations in README

### Risk 3: Large Similar Content Payloads
**Impact**: Low (minor performance hit)  
**Probability**: Low (TMDB returns max 20 similar items)  
**Mitigation**:
- Limit to 12 items per carousel
- Lazy load images (native `loading="lazy"`)
- Async fetch (don't block main content render)

### Risk 4: Contrast Fixes Break Dark Theme
**Impact**: Medium (would require rework)  
**Probability**: Low (white text works on dark backgrounds in both themes)  
**Mitigation**:
- Test both themes after each change
- Use `text-white` (absolute) instead of `dark:text-white` (conditional)
- Verify with automated contrast checker (WCAG AA)

### Risk 5: Responsive Layout Issues
**Impact**: Medium (affects mobile users)  
**Probability**: Medium (complex grid layout)  
**Mitigation**:
- Mobile-first CSS (start with smallest breakpoint)
- Test on real devices (Chrome DevTools responsive mode)
- Flexbox/Grid fallbacks for older browsers

---

## Testing Strategy

### Unit Tests (Phase 6)
- `MetadataCard.tsx`: Render with various props, missing data
- `SimilarContent.tsx`: Loading states, empty results, error handling
- Utility functions: `formatCurrency()`, `formatRuntime()`

### Integration Tests (Phase 6)
- Detail page flow: Navigate from list → detail → similar → detail
- API integration: Mock TMDB responses, verify field mapping
- Cache behavior: Verify stale data served during refresh

### Manual Testing (Phase 3)
- Light mode contrast: Test with 10+ different movies (dark posters)
- Dark mode preservation: Verify no regressions
- All breakpoints: 320px, 768px, 1440px, 1920px
- Carousel: Scroll, click, keyboard navigation

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (Cached) | <500ms | Chrome DevTools Performance tab |
| Page Load (Fresh) | <1.5s | Network tab, TMDB API response time |
| Similar Content Render | <300ms | React DevTools Profiler |
| Carousel Scroll FPS | 60fps | Chrome DevTools Rendering tab |
| Lighthouse Accessibility | >90 | Chrome Lighthouse audit |
| TypeScript Errors | 0 | `npm run typecheck` |

---

## Success Criteria

### Must Have (Phase 3 Complete)
- ✅ Title and description readable in both light and dark modes
- ✅ WCAG AA contrast ratio (4.5:1 for text, 3:1 for UI)
- ✅ Runtime, status, budget, revenue displayed (movies)
- ✅ Seasons, episodes, status displayed (TV shows)
- ✅ Production companies/networks with logos (when available)
- ✅ Genre pills below title with color coding
- ✅ Similar content carousel loads and scrolls smoothly
- ✅ TypeScript 0 errors
- ✅ No console warnings/errors

### Nice to Have (Stretch Goals)
- Glass morphism effects on all cards
- Animated transitions (fade-in, hover scale)
- Loading skeletons for hero section
- Keyboard navigation for carousel (arrow keys)
- Touch gestures for mobile carousel (swipe)

### Out of Scope (Future Phases)
- Cast and crew information (Phase 4+)
- User reviews integration (Phase 4+)
- Watchlist/favorites (Phase 4+)
- Season-by-season breakdowns (Phase 4+)

---

## Rollback Plan

If Phase 3 implementation encounters blockers:

1. **Contrast Fixes (T-DETAIL-004)**: Can be deployed independently
   - Minimal risk, high impact
   - Revert: `git revert <commit-hash>`

2. **Metadata Grid (T-DETAIL-005-006)**: Can be feature-flagged
   - Add `ENABLE_METADATA_GRID` env var
   - Graceful degradation: Show basic info if disabled

3. **Similar Content (T-DETAIL-007)**: Can be omitted
   - Independent feature, doesn't block other work
   - Remove component import if needed

4. **Full Rollback**: Revert all Phase 3 commits
   - Identify commits: `git log --oneline | grep "DETAIL"`
   - Create revert branch: `git revert <range>`

---

## Dependencies & Blockers

### External Dependencies
- ✅ TMDB API access (already configured)
- ✅ React 18.3, TailwindCSS 3.4 (already installed)
- ✅ Lucide React icons (already installed)

### Internal Dependencies
- ✅ Phase 1 complete (sidebar, download panel fixes)
- 🔄 Phase 2 mostly complete (MoviesView, TVSeriesView done)

### Potential Blockers
- ⚠️ TMDB API downtime (rare, but possible)
  - Mitigation: Serve cached data, display error gracefully
- ⚠️ Missing TMDB data for specific movies (common for older titles)
  - Mitigation: Conditional rendering, no "N/A" placeholders

---

## Communication Plan

### Daily Updates
- Post commit summaries to team chat
- Screenshot before/after for visual changes
- Flag blockers immediately

### Milestone Reviews
- After T-DETAIL-003: Backend ready (API + types aligned)
- After T-DETAIL-007: UI complete (all components built)
- After T-DETAIL-010: QA complete (ready for user review)

### Final Deliverable
- Pull request with screenshots (light/dark, mobile/desktop)
- Updated README with new detail page features
- Video demo (optional): Navigate from list → detail → similar

---

## Next Steps

### Immediate (Next 1 Hour)
1. ✅ Update `tasks.md` to reflect Phase 3 as active
2. 🚀 Start T-DETAIL-001: Extend TMDB data fetching
   - File: `src/metadata.ts`
   - Update `fetchByTMDBId()` method
   - Test with console.log

### Today (Next 3 Hours)
3. Complete backend tasks (T-DETAIL-001 to T-DETAIL-003)
4. Test API endpoint with curl/Postman
5. Commit: "feat(Phase3): Extend TMDB metadata fetching and add similar content endpoint"

### Tomorrow (Next 4 Hours)
6. Start frontend UI (T-DETAIL-004 to T-DETAIL-007)
7. Fix contrast issues (highest priority)
8. Add metadata grid and genre pills
9. Build similar content carousel

### End of Week (Next 1.5 Hours)
10. Polish and QA (T-DETAIL-008 to T-DETAIL-010)
11. Take screenshots for user review
12. Update REPORT.md with Phase 3 status

---

## Approval & Sign-off

**Plan Created**: 2025-10-22  
**Plan Approved**: 2025-10-22 (User: "Your plan is approved. Proceed with execution.")  
**Constitution Check**: ✅ Passed  
**Ready for Implementation**: ✅ Yes  

**Next Action**: Begin T-DETAIL-001 (Extend TMDB data fetching in `src/metadata.ts`)

---

*This plan follows the structure defined in `.specify/templates/commands/plan.md` and aligns with ChillyMovies project constitution.*
