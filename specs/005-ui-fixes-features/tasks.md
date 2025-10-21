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

## 🎯 Phase 3: Movie & TV Detail Pages Enhancement

**Goal**: Ensure detail pages fetch live TMDB data, show comprehensive metadata, add "Similar" carousel

### 3.1 Metadata Completeness
- [ ] T013 [2h] [P1] **Verify and display all required metadata fields** in MovieDetailView and TVDetailView
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - Required fields (ensure all are fetched and displayed):
    - ✅ Title, poster, backdrop (already present)
    - ✅ Synopsis/overview, release date, year (already present)
    - ✅ Rating (already present)
    - ⚠️ Runtime (add if missing)
    - ⚠️ Genres (add badges)
    - ⚠️ Production companies (add logos/text)
    - ⚠️ Budget & Revenue (movies only, format with $ signs)
  - Layout: Add metadata grid below action buttons

- [ ] T014 [1h] [P2] **Improve cinematic header layout**: Enhance poster + backdrop gradient design
  - Current: Backdrop with gradient overlay is good
  - Enhance: Add glassmorphism card for metadata section, improve responsive layout
  - Mobile: Stack poster and info vertically

### 3.2 Similar/Recommended Content
- [ ] T015 [2.5h] [P1] **Add "Similar Movies/TV Shows" carousel at bottom of detail pages**
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - Component: `src/renderer/components/SimilarCarousel.tsx` (new file)
  - API: `metadataApi.getSimilar(id, mediaType)`
  - Design: Horizontal scroll carousel with 6-8 cards visible
  - Cards: Clickable, navigate to respective detail page
  - Include: Poster, title, year, rating

### 3.3 Loading & Error States
- [ ] T016 [1h] [P2] **Enhance loading states with skeleton screens**: Replace spinner with content skeleton
  - Files: `src/renderer/views/MovieDetailView.tsx`, `src/renderer/views/TVDetailView.tsx`
  - Design: Skeleton for poster (rectangle), title (bar), metadata (lines)
  - Library: Consider using react-loading-skeleton or custom implementation

**Checkpoint**: Detail pages are comprehensive, polished, and load live TMDB data reliably

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
