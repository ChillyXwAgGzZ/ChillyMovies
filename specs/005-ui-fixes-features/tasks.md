---
description: "UI Fixes & Feature Implementation - Phase 2"
created: 2025-10-21
---

# Tasks: UI Fixes & Feature Implementation

**Status**: 🚀 Ready for implementation  
**Prerequisites**: Theme propagation complete, CORS fixes applied, sidebar redesign complete  
**Branch**: `004-004-theme-fetch` (continue from current work)

**Organization**: Tasks are grouped by priority and feature area for efficient implementation.

## Format: `[ID] [EST] [Priority] Description`
- **[EST]**: Estimated time in hours
- **[Priority]**: P0 (critical bug), P1 (high), P2 (medium), P3 (low)

---

## 🔥 Phase 1: Critical Bugs & Rendering Issues

**Goal**: Fix sidebar rendering bug and download panel UX issues (from user screenshots)

### 1.1 Sidebar Collapse Control Fix
- [ ] T001 [0.5h] [P0] **Investigate sidebar collapse button rendering**: Check if translation keys `sidebar.collapse` are missing in i18n files, verify button text appears in both collapsed/expanded states
  - Files: `src/renderer/i18n.ts`, `src/renderer/components/Sidebar.tsx`
  - Test: Toggle sidebar, verify "Collapse"/"Expand" text renders properly in both light/dark themes
  - Expected: Button shows chevron icon + text label consistently

### 1.2 Download Panel Fixes (Critical UX Issues)
- [ ] T002 [1h] [P0] **Fix Select All/Deselect All button state in light mode**: Buttons appear invisible/low contrast in light theme (see screenshot)
  - File: `src/renderer/components/DownloadPanel.tsx`, `src/renderer/components/EpisodeSelector.tsx`
  - Fix: Replace `from-gray-700 to-gray-600` with proper light/dark theme classes
  - Example: `bg-gradient-to-r from-gray-700 to-gray-600 dark:from-gray-700 dark:to-gray-600 hover:from-gray-600 hover:to-gray-500` → `from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white`
  
- [ ] T003 [0.5h] [P0] **Replace "Start" label with "Download"** in all download buttons
  - Files: `src/renderer/components/DownloadPanel.tsx`, `src/renderer/components/EpisodeSelector.tsx`
  - Find: `{t("download.start")` → Replace with `{t("download.button")` or `"Download"`
  - Update i18n keys if needed

- [ ] T004 [1.5h] [P1] **Fix auto-selection behavior**: Currently auto-selects ALL torrents; should only auto-select the smallest torrent for chosen quality
  - File: `src/renderer/components/DownloadPanel.tsx` (line ~70-80)
  - Current: `setSelectedTorrent(best)` after sorting
  - Add: Checkbox selection per torrent, allow manual override
  - Default: Auto-check smallest torrent, but user can uncheck/select different one
  
- [ ] T005 [1h] [P1] **Show full torrent details before download**: Display chosen torrent name, quality, size, estimated download time
  - File: `src/renderer/components/DownloadPanel.tsx` footer section
  - Add: Expandable "Selected Torrent Details" section above Download button
  - Include: Full title, quality badge, size (GB/MB), seeders/leechers count

- [ ] T006 [2h] [P2] **TV series per-episode quality selection**: Allow setting quality per episode OR apply season-wide quality after confirmation
  - File: `src/renderer/components/EpisodeSelector.tsx`
  - Add: "Set quality for all selected episodes" dropdown in footer
  - Workflow: Select episodes → Choose quality → Preview total size → Confirm download
  - Show: Total estimated size for all selected episodes

**Checkpoint**: Download panel UX is clear, predictable, and works in both light/dark themes

---

## 🎬 Phase 2: Movie & TV Listing Pages (New Feature)

**Goal**: Add dedicated Movies and TV Series pages with infinite scroll, filters, and polished cards

### 2.1 Sidebar Navigation Enhancement
- [ ] T007 [1h] [P1] **Add Movies and TV Series tabs to sidebar**: Replace or supplement existing nav with top-level Movie/TV sections
  - File: `src/renderer/components/Sidebar.tsx`
  - Options:
    - A) Add "Movies" and "TV Series" as separate nav items (replace Home or add new items)
    - B) Create expandable "Browse" section with Movies/TV sub-items
  - Design: Match current gradient style, add Film and Tv icons from lucide-react
  - Routes: `/movies`, `/tv-series`

### 2.2 Movies Listing View
- [ ] T008 [3h] [P1] **Create MoviesView with infinite scroll**: New view showing paginated movie results
  - File: `src/renderer/views/MoviesView.tsx` (new file)
  - Features:
    - Infinite scroll using IntersectionObserver
    - Grid layout (5 columns desktop, responsive)
    - "Load More" skeleton cards during fetch
    - Scroll position persistence (save/restore on navigation)
  - API: `metadataApi.getPopular('movie', page)` or similar endpoint
  
- [ ] T009 [2h] [P1] **Add filter sidebar to MoviesView**: Genre, year, rating, sort options
  - Component: `src/renderer/components/FilterPanel.tsx` (new file, reusable)
  - Filters:
    - Genre: Multi-select checkboxes (Action, Comedy, Drama, etc.)
    - Year: Range slider (1900-2025)
    - Rating: Min rating slider (0-10)
    - Sort: Dropdown (Popularity, Rating, Release Date, Title A-Z)
  - Persist: Save filter state to localStorage while scrolling
  
- [ ] T010 [1.5h] [P2] **Add genre/year/rating badges to movie cards**: Show genre tags and year on hover
  - File: `src/renderer/components/MovieCard.tsx`
  - Design: Small genre badges at bottom, year badge at top-left
  - Animation: Fade in on hover with backdrop blur

### 2.3 TV Series Listing View
- [ ] T011 [2.5h] [P1] **Create TVSeriesView with infinite scroll**: Similar to MoviesView but for TV shows
  - File: `src/renderer/views/TVSeriesView.tsx` (new file)
  - Features: Same as T008 (infinite scroll, grid, skeletons, persistence)
  - API: `metadataApi.getPopular('tv', page)`
  - Additional: Show "Seasons: X" badge on cards
  
- [ ] T012 [1h] [P2] **Reuse FilterPanel for TV shows**: Adapt genre list for TV genres (Reality, Documentary, etc.)
  - File: `src/renderer/components/FilterPanel.tsx`
  - Props: `mediaType: 'movie' | 'tv'` to switch genre lists
  - TV-specific filters: Status (Returning Series, Ended, Cancelled)

**Checkpoint**: Movies and TV Series pages functional with infinite scroll and filters

---

## 🎯 Phase 3: Movie & TV Detail Pages Enhancement **[ACTIVE 🚀]**

**Goal**: Fix contrast issues, show comprehensive metadata, add "Similar" carousel  
**Status**: 0/10 tasks complete  
**Duration**: ~8.5 hours estimated  
**Detailed Plan**: See `/specs/005-ui-fixes-features/detail-pages-enhancement-plan.md` and `/specs/005-ui-fixes-features/plan.md`

### 3.1 Backend Enhancements (3 hours)

- [ ] T-DETAIL-001 [1.5h] [P1] **Extend TMDB data fetching** in metadata.ts
  - File: `src/metadata.ts` (line ~113, `fetchByTMDBId` method)
  - **Task**: Update TMDB API field mapping to include:
    - `runtime` (minutes), `status` (Released/In Production/etc.)
    - `budget` (USD), `revenue` (USD)
    - `production_companies` (array: `{id, name, logo_path}`)
    - `networks` (TV only, array: `{id, name, logo_path}`)
    - `genres` (full objects: `{id, name}` not just IDs)
    - `tagline`, `original_language`
    - `number_of_seasons`, `number_of_episodes` (TV only)
    - `episode_run_time` (TV only, array of typical runtimes)
    - `last_air_date` (TV only)
  - **Implementation**:
    ```typescript
    return {
      id: data.id,
      title: data.title || data.name,
      overview: data.overview,
      // ... existing fields ...
      runtime: data.runtime,
      status: data.status,
      budget: data.budget,
      revenue: data.revenue,
      productionCompanies: (data.production_companies || []).map(c => ({
        id: c.id,
        name: c.name,
        logoPath: c.logo_path ? `https://image.tmdb.org/t/p/w200${c.logo_path}` : undefined
      })),
      // ... add remaining fields ...
    };
    ```
  - **Test**: Console.log response for Movie ID 299536 (Avengers: Infinity War), TV ID 1399 (Game of Thrones)

- [ ] T-DETAIL-002 [1h] [P1] **Add similar content endpoint**
  - Files: `src/metadata.ts`, `src/api-server.ts`
  - **Task 1**: Create `fetchSimilar()` method in TMDBMetadataProvider
    ```typescript
    async fetchSimilar(tmdbId: number, mediaType: "movie" | "tv"): Promise<MediaMetadata[]> {
      const url = `${this.baseUrl}/${mediaType}/${tmdbId}/similar?api_key=${this.apiKey}&page=1`;
      // Fetch, map to MediaMetadata[], limit to 12 items, cache 30min
    }
    ```
  - **Task 2**: Add API route in api-server.ts (line ~538 after trailers endpoint)
    ```typescript
    app.get("/metadata/:mediaType/:id/similar", async (req: Request, res: Response) => {
      const { mediaType, id } = req.params;
      const result = await metadata.fetchSimilar(parseInt(id), mediaType as "movie" | "tv");
      res.json({ success: true, data: result } as ApiResponse);
    });
    ```
  - **Test**: `curl http://localhost:3000/metadata/movie/299536/similar | jq`

- [ ] T-DETAIL-003 [0.5h] [P1] **Update type definitions**
  - Files: `src/renderer/services/api.ts`, `src/types.ts`
  - **Task**: Extend `MediaMetadata` interface with new fields (see detail-pages-enhancement-plan.md line 285)
  - **Add to api.ts**:
    ```typescript
    async getSimilar(id: number, mediaType: "movie" | "tv"): Promise<MediaMetadata[]> {
      const response = await fetch(`${API_BASE_URL}/metadata/${mediaType}/${id}/similar`);
      const data: ApiResponse<MediaMetadata[]> = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch similar content");
      return data.data || [];
    }
    ```
  - **Test**: TypeScript errors should be 0 (`npm run typecheck`)

**Checkpoint 1**: Backend ready, API tested with curl, types aligned

---

### 3.2 Frontend UI Enhancements (4 hours)

- [ ] T-DETAIL-004 [1h] [P0] **Fix text contrast in hero section** ⚠️ **CRITICAL - START HERE**
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - **Problem**: Black text on dark poster backgrounds in light mode (see user screenshot)
  - **Fix 1**: Darken backdrop gradient (line ~118 in MovieDetailView.tsx)
    ```tsx
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40"></div>
    ```
  - **Fix 2**: Force white text for title and description (line ~132)
    ```tsx
    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" 
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
      {movie.title}
    </h1>
    <p className="text-gray-100 text-lg mb-8" 
       style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
      {movie.overview}
    </p>
    ```
  - **Fix 3**: Update button styles (line ~165)
    ```tsx
    // Download button
    className="... bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/50"
    
    // Watch Trailer button
    className="... bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white"
    ```
  - **Test**: Open "Captain Hook - The Cursed Tides" in light mode, verify title/description/buttons readable
  - **Acceptance**: Screenshot showing clear text contrast in light mode

- [ ] T-DETAIL-005 [1.5h] [P1] **Create metadata info grid**
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - **Task 1**: Create reusable `MetadataCard` component (new file: `src/renderer/components/MetadataCard.tsx`)
    ```tsx
    interface MetadataCardProps {
      label: string;
      value: string | React.ReactNode;
      icon?: React.ReactNode;
    }
    export const MetadataCard: React.FC<MetadataCardProps> = ({ label, value, icon }) => (
      <div className="bg-white/5 dark:bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4">
        {/* ... render label + value ... */}
      </div>
    );
    ```
  - **Task 2**: Add utility functions (new file: `src/renderer/utils/formatting.ts`)
    ```typescript
    export function formatCurrency(amount: number): string {
      if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
      if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
      return `$${amount.toLocaleString()}`;
    }
    export function formatRuntime(minutes: number): string {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    ```
  - **Task 3**: Add 2x2 grid below action buttons in MovieDetailView.tsx (after line ~180)
    ```tsx
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {movie.status && <MetadataCard label="Status" value={movie.status} />}
      {movie.runtime && <MetadataCard label="Runtime" value={formatRuntime(movie.runtime)} />}
      {movie.budget && <MetadataCard label="Budget" value={formatCurrency(movie.budget)} />}
      {movie.revenue && <MetadataCard label="Revenue" value={formatCurrency(movie.revenue)} />}
      {movie.productionCompanies && movie.productionCompanies.length > 0 && (
        <MetadataCard label="Production" value={
          <div className="flex flex-wrap gap-2">
            {movie.productionCompanies.slice(0, 3).map(c => (
              c.logoPath ? <img key={c.id} src={c.logoPath} alt={c.name} className="h-8" /> : c.name
            ))}
          </div>
        } />
      )}
    </div>
    ```
  - **Test**: Verify all metadata displays correctly, conditional rendering works (no "undefined" shown)

- [ ] T-DETAIL-006 [0.5h] [P1] **Add genre pills to hero section**
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - **Task 1**: Create genre color mapping (add to MovieDetailView.tsx top)
    ```typescript
    const GENRE_COLORS: Record<number, string> = {
      28: "bg-red-500/80",      // Action
      12: "bg-amber-500/80",    // Adventure
      16: "bg-purple-500/80",   // Animation
      35: "bg-yellow-500/80",   // Comedy
      80: "bg-gray-700/80",     // Crime
      18: "bg-blue-500/80",     // Drama
      27: "bg-red-800/80",      // Horror
      // ... add remaining 24 genres (see detail-pages-enhancement-plan.md line 480)
    };
    ```
  - **Task 2**: Render genre pills below title (line ~145, after rating badge)
    ```tsx
    {movie.genres && movie.genres.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {movie.genres.slice(0, 6).map(genre => (
          <span key={genre.id} 
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${GENRE_COLORS[genre.id] || 'bg-gray-600/80'}`}>
            {genre.name}
          </span>
        ))}
      </div>
    )}
    ```
  - **Test**: Verify genre pills display with correct colors, max 6 visible

- [ ] T-DETAIL-007 [1h] [P1] **Create similar content carousel**
  - Files: New component `src/renderer/components/SimilarContent.tsx`
  - **Task 1**: Create component with props `mediaType`, `currentId`
    ```tsx
    interface SimilarContentProps {
      mediaType: "movie" | "tv";
      currentId: number;
    }
    export const SimilarContent: React.FC<SimilarContentProps> = ({ mediaType, currentId }) => {
      const [similar, setSimilar] = useState<MediaMetadata[]>([]);
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        metadataApi.getSimilar(currentId, mediaType)
          .then(data => setSimilar(data.slice(0, 12)))
          .catch(err => console.error("Failed to fetch similar content:", err))
          .finally(() => setLoading(false));
      }, [currentId, mediaType]);
      
      return (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">
            Similar {mediaType === "movie" ? "Movies" : "TV Shows"}
          </h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => <div key={i} className="min-w-[200px] h-[300px] bg-gray-700 animate-pulse rounded-lg" />)
            ) : (
              similar.map(item => (
                <div key={item.id} className="min-w-[200px] snap-start">
                  <MovieCard media={item} />
                </div>
              ))
            )}
          </div>
        </div>
      );
    };
    ```
  - **Task 2**: Add to MovieDetailView.tsx and TVDetailView.tsx (bottom, after metadata grid)
    ```tsx
    {id && <SimilarContent mediaType="movie" currentId={parseInt(id)} />}
    ```
  - **Test**: Scroll carousel, click on similar item, verify navigation to detail page

**Checkpoint 2**: Detail pages visually complete, all metadata + similar content displayed

---

### 3.3 Polish & Testing (1.5 hours)

- [ ] T-DETAIL-008 [0.5h] [P2] **Add animations and transitions**
  - Files: `MovieDetailView.tsx`, `TVDetailView.tsx`, `SimilarContent.tsx`
  - **Task 1**: Add fade-in animation to main content (wrap in div at line ~115)
    ```tsx
    <div className="min-h-screen opacity-0 animate-fade-in">
    ```
  - **Task 2**: Add to tailwind.config.js if needed
    ```js
    theme: {
      extend: {
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in forwards',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
    ```
  - **Task 3**: Add hover effects to metadata cards
    ```tsx
    <MetadataCard className="transition-transform hover:scale-105" ... />
    ```

- [ ] T-DETAIL-009 [0.5h] [P1] **Test responsiveness**
  - **Test Plan**:
    - [ ] Mobile (320px): Poster stacks above info, metadata grid 1 column
    - [ ] Mobile (375px): Same as 320px
    - [ ] Tablet (768px): Metadata grid 2 columns, carousel scrolls smoothly
    - [ ] Laptop (1024px): Full layout, 2 columns
    - [ ] Desktop (1440px): Full layout, 2 columns
    - [ ] Large (1920px): Full layout, 2 columns
  - **Both Themes**: Test all breakpoints in light and dark mode
  - **Carousel**: Verify touch scroll on mobile, mouse drag on desktop

- [ ] T-DETAIL-010 [0.5h] [P1] **Final QA and screenshots**
  - **QA Checklist**:
    - [ ] Light mode: Title readable on dark backdrops (test "Captain Hook")
    - [ ] Dark mode: No visual regressions
    - [ ] Metadata: All fields display correctly (test 5+ movies/TV shows)
    - [ ] Genres: Pills show correct colors, max 6 visible
    - [ ] Similar: Carousel loads, scrolls, navigates correctly
    - [ ] TypeScript: 0 errors (`npm run typecheck`)
    - [ ] Console: No warnings or errors
    - [ ] Performance: Page loads <1.5s (fresh), <500ms (cached)
  - **Screenshots**:
    - [ ] Before/After: "Captain Hook" in light mode (contrast fix)
    - [ ] Metadata grid: Movie with all fields (Avengers: Infinity War)
    - [ ] Metadata grid: TV show with all fields (Game of Thrones)
    - [ ] Similar carousel: Desktop view
    - [ ] Similar carousel: Mobile view
    - [ ] Genre pills: Multiple genres displayed
  - **Manual Test Flow**: Movies list → Movie detail → Similar movie → Detail → Back

**Checkpoint 3**: Phase 3 complete, ready for user review ✅

---

## 🔍 Phase 4: Search UX Enhancement

**Goal**: Implement inline typeahead suggestions without navigating away from current page

### 4.1 Search Typeahead Component
- [ ] T017 [3h] [P1] **Create inline search suggestions dropdown**: Attaches to search input, shows results live
  - Component: `src/renderer/components/SearchTypeahead.tsx` (new file)
  - Behavior:
    - Typing triggers debounced search (300ms delay)
    - Shows dropdown with 5-8 results (poster thumbnail + title + year)
    - Enter key OR clicking suggestion navigates to detail page
    - Dropdown closes on blur/escape
    - **Critical**: Does NOT navigate away while typing
  - Design: Absolute positioned dropdown, glassmorphism background, smooth fade-in animation

- [ ] T018 [1.5h] [P1] **Integrate SearchTypeahead into Header/SearchBar**: Replace or enhance existing search
  - File: `src/renderer/components/Header.tsx` or search component
  - API: `metadataApi.search(query, { limit: 8 })`
  - Works from: Any page (Home, Movies, TV, Library, Settings)
  - Preserve: Page content visible while suggestions shown (use z-index layering)

- [ ] T019 [1h] [P2] **Add search result highlighting**: Highlight matched text in suggestions
  - Algorithm: Bold matching characters in title
  - Example: Searching "dark" highlights "**Dark** Knight"

**Checkpoint**: Search is fast, non-intrusive, and works from any page

---

## 🎨 Phase 5: Visual Consistency & Theme Polish

**Goal**: Fix remaining hardcoded dark styles, ensure light theme works everywhere

### 5.1 Theme Audit & Fixes
- [ ] T020 [2h] [P1] **Audit and fix remaining hardcoded dark styles** (from screenshots)
  - Files to check:
    - `src/renderer/components/DownloadPanel.tsx` (quality buttons in light mode)
    - `src/renderer/components/EpisodeSelector.tsx` (Select All buttons, episode cards)
    - `src/renderer/views/SettingsView.tsx` (tabs, cards)
    - Any modals or overlays
  - Pattern: Replace `bg-gray-700` → `bg-gray-100 dark:bg-gray-700`, add proper text colors
  - Test: Toggle light theme, check every page and modal

### 5.2 CSS Variables & Theme Tokens
- [ ] T021 [1.5h] [P2] **Introduce CSS variables for theme colors**: Reduce hardcoded Tailwind classes
  - File: `src/renderer/index.css`
  - Define: `--color-primary`, `--color-background`, `--color-text`, etc.
  - Benefits: Easier theme switching, consistent colors, better maintainability
  - Refactor: Replace common gradient patterns with variables

### 5.3 Sidebar Enhancements
- [ ] T022 [2h] [P2] **Improve sidebar logo/icon**: Create or source a clean SVG logo
  - Current: "CM" text badge (functional but basic)
  - Options:
    - A) Design custom SVG icon (film reel, play button, movie camera)
    - B) Use icon from Flaticon/Icons8 (with license)
    - C) Create animated gradient logo with better styling
  - File: `src/renderer/components/Sidebar.tsx`
  - Size: 48x48px, works in light/dark themes

- [ ] T023 [1h] [P3] **Refine language selector UI**: Make it more compact and polished
  - File: `src/renderer/components/Sidebar.tsx`
  - Current: Card with dropdown (good)
  - Enhance: Add smooth flag animation on change, improve collapsed mode icon

**Checkpoint**: All pages respect light/dark theme, no hardcoded dark styles remain

---

## ✅ Phase 6: Testing & Quality Assurance

**Goal**: Add tests for new features, ensure reliability

### 6.1 Unit Tests
- [ ] T024 [2h] [P1] **Test download selection behavior**: Select/deselect logic, default selection
  - File: `tests/components/download-panel.test.tsx` (new file)
  - Cases:
    - Default selects smallest torrent
    - User can manually select different torrent
    - Selected state persists across quality changes
    - Multiple torrents can be compared before selecting

- [ ] T025 [1.5h] [P1] **Test search typeahead behavior**: Debouncing, navigation, dropdown close
  - File: `tests/components/search-typeahead.test.tsx` (new file)
  - Cases:
    - Search triggers after 300ms delay
    - Typing resets timer (debounce works)
    - Enter navigates to first result
    - Escape closes dropdown
    - Clicking outside closes dropdown

### 6.2 Integration Tests
- [ ] T026 [2h] [P2] **Test infinite scroll loading**: Verify pagination, scroll position restoration
  - File: `tests/integration/infinite-scroll.test.ts` (new file)
  - Cases:
    - Scrolling to bottom triggers next page load
    - Skeleton cards appear during loading
    - No duplicate items loaded
    - Scroll position restored after navigation back

- [ ] T027 [1.5h] [P2] **Test theme propagation across all pages**: Automated theme switching test
  - File: `tests/integration/theme-propagation.test.ts` (new file)
  - Cases:
    - Toggle theme in Settings
    - Navigate to all pages (Home, Movies, TV, Library, Downloads, Settings, Movie Detail, TV Detail)
    - Verify light theme classes applied (no dark backgrounds in light mode)
    - Check localStorage persistence

### 6.3 Visual Testing (Manual)
- [ ] T028 [1h] [P1] **Manual QA: Screenshot all pages** in light and dark themes
  - Pages to capture:
    - Home (with search results)
    - Movies listing (with filters open)
    - TV Series listing (with filters open)
    - Movie detail page
    - TV detail page
    - Downloads page (with active download)
    - Library page
    - Settings page
    - Sidebar collapsed and expanded
    - Download panel modal
    - Episode selector modal
  - Document: Any remaining visual bugs, low contrast areas, misaligned elements

**Checkpoint**: Tests passing, visual bugs documented

---

## 📊 Phase 7: Build, Report & Iteration

**Goal**: Run dev build, collect feedback, report status

### 7.1 Development Build Testing
- [ ] T029 [0.5h] [P1] **Run development build and test all features**
  - Commands: `npm run dev`, open app
  - Smoke test: Try all new features (Movies page, TV page, search typeahead, download panel, filters)
  - Log: Any console errors, API failures, visual glitches

### 7.2 Documentation & Reporting
- [ ] T030 [1h] [P2] **Update README and DEVELOPMENT.md**: Document new features and navigation
  - Files: `README.md`, `DEVELOPMENT.md`
  - Add: Screenshots of Movies/TV pages, updated navigation instructions
  - Include: Known issues and workarounds

- [ ] T031 [0.5h] [P1] **Create status report with screenshots and blockers**
  - Format: Markdown report with embedded screenshots
  - Include:
    - ✅ Completed features
    - 🚧 In-progress work
    - ❌ Blockers (API errors, missing TMDB data, etc.)
    - 📊 Test results summary
    - 📸 One screenshot per major page/feature

**Checkpoint**: All work documented, ready for user review and feedback

---

## 📋 Summary & Estimates

### Time Estimates by Phase
- **Phase 1 (Critical Bugs)**: 5.0 hours
- **Phase 2 (Movies/TV Pages)**: 10.5 hours
- **Phase 3 (Detail Pages)**: 5.5 hours
- **Phase 4 (Search UX)**: 5.5 hours
- **Phase 5 (Theme Polish)**: 6.5 hours
- **Phase 6 (Testing)**: 9.0 hours
- **Phase 7 (Build & Report)**: 2.0 hours

**Total Estimated Time**: ~44 hours (~5-6 days of focused work)

### Priority Breakdown
- **P0 (Critical)**: 3 tasks, ~3.0 hours (do first)
- **P1 (High)**: 17 tasks, ~27.5 hours (core features)
- **P2 (Medium)**: 10 tasks, ~12.5 hours (polish)
- **P3 (Low)**: 1 task, ~1.0 hour (nice-to-have)

### Recommended Implementation Order
1. **Day 1**: T001-T006 (Critical bugs - sidebar, download panel)
2. **Day 2**: T007-T012 (Movies/TV pages foundation)
3. **Day 3**: T013-T019 (Detail pages + search)
4. **Day 4**: T020-T023 (Theme polish + visuals)
5. **Day 5**: T024-T027 (Testing)
6. **Day 6**: T028-T031 (QA, screenshots, reporting)

---

## 🎯 Acceptance Criteria (User Review)

Before marking this spec complete, verify:

- [ ] Sidebar collapse button renders properly with text label
- [ ] Download panel works in light mode (buttons visible, Select All functional)
- [ ] Download button says "Download" not "Start"
- [ ] Torrent auto-selection picks smallest file but allows manual override
- [ ] Movies and TV Series pages exist with infinite scroll
- [ ] Filters work and persist during scroll
- [ ] Detail pages show all required metadata (genres, budget, runtime, etc.)
- [ ] "Similar" carousel shows related content
- [ ] Search typeahead works from any page without navigation
- [ ] Light theme works everywhere (no hardcoded dark styles)
- [ ] All tests passing
- [ ] Screenshots provided for all major pages

**Definition of Done**: All P0 and P1 tasks complete, P2 tasks at 80%, visual bugs documented, screenshots provided.
