# UI Fixes & Features - Implementation Report

**Date**: 2025-10-21  
**Status**: 📋 Tasks defined, awaiting approval to implement  
**Branch**: `004-004-theme-fetch`

---

## 📊 Current State Analysis

### ✅ Completed from Previous Phase (004-004-theme-fetch)
1. **Theme Propagation** - 100% complete
   - All components now respect light/dark theme
   - ThemeContext working with localStorage persistence
   - Manual testing confirmed working

2. **CORS & Fetch Fixes** - 95% complete
   - Vite proxy configuration added
   - Retry logic with exponential backoff implemented
   - Enhanced error handling with user-friendly messages
   - Integration tests passing (11/11)

3. **Sidebar Redesign** - 95% complete
   - Modern gradient styling applied
   - Keyboard navigation implemented
   - ARIA labels added for accessibility
   - Toggle button repositioned to bottom

4. **Visual Polish** - 80% complete
   - Gradient theme applied to all major components
   - DownloadPanel, EpisodeSelector, MovieCard enhanced
   - Consistent hover effects and shadows
   - Rounded-xl borders throughout

---

## 🐛 Issues Identified (From User Screenshots)

### Critical Issues (P0)

1. **Sidebar Collapse Button Label Issue**
   - **Status**: Investigated, awaiting fix
   - **Root Cause**: Translation key `sidebar.collapse` may be missing from i18n files
   - **Evidence**: Button shows chevron icon but text may not render consistently
   - **Impact**: UX confusion when toggling sidebar
   - **Fix**: Add missing translation keys, verify in both collapsed/expanded states

2. **Download Panel - Light Mode Bugs**
   - **Status**: Identified from screenshot
   - **Issues**:
     - Select All / Deselect All buttons invisible/low contrast in light mode
     - Button uses `from-gray-700 to-gray-600` (dark only)
     - Text color needs `text-gray-900 dark:text-white`
   - **Impact**: Users in light mode cannot see selection controls
   - **Fix**: Add proper light theme classes to gradient buttons

3. **Download Button Label**
   - **Status**: Quick fix needed
   - **Issue**: Button says "Start" instead of "Download"
   - **Impact**: Unclear action verb
   - **Fix**: Replace `t("download.start")` with `t("download.button")` or "Download"

### High Priority Issues (P1)

4. **Torrent Auto-Selection Behavior**
   - **Status**: Logic issue
   - **Current**: Auto-selects smallest torrent (good)
   - **Problem**: No way to manually select different torrent before downloading
   - **Expected**: Show checkboxes, allow user to compare and select
   - **Fix**: Add checkbox selection UI, preserve auto-select as default

5. **Missing Full Torrent Details**
   - **Status**: UX gap
   - **Current**: Footer shows title and size
   - **Missing**: Full torrent name, quality badge, seeders/leechers, estimated time
   - **Fix**: Add expandable "Torrent Details" section before Download button

6. **TV Series Per-Episode Quality**
   - **Status**: Feature gap
   - **Current**: Quality applies globally
   - **Expected**: Set quality per episode OR apply to all after confirmation
   - **Fix**: Add quality dropdown to EpisodeSelector, show total size preview

---

## 🚀 New Features to Implement

### Movies & TV Series Pages (P1)
- Dedicated `/movies` and `/tv-series` routes
- Infinite scroll with IntersectionObserver
- Filter panel: Genre, Year, Rating, Sort
- Persistent filter state during scroll
- 5-column responsive grid layout

### Enhanced Detail Pages (P1)
- Additional metadata: Runtime, Genres, Production companies, Budget/Revenue
- "Similar Movies/TV" carousel at bottom
- Improved cinematic layout with glassmorphism
- Skeleton loading states (replace spinners)

### Search Typeahead (P1)
- Inline suggestions dropdown (5-8 results)
- Debounced search (300ms)
- Poster thumbnail + title + year
- Works from any page without navigation
- Enter or click navigates to detail page

### Theme Consistency (P1)
- Fix all remaining hardcoded dark styles
- CSS variables for theme tokens
- Improved sidebar logo (SVG)
- Refined language selector UI

---

## 📋 Tasks Summary

**Total Tasks**: 31  
**Estimated Time**: ~44 hours (~5-6 days)

### By Priority
- **P0 (Critical)**: 3 tasks, 3.0 hours - **DO FIRST**
- **P1 (High)**: 17 tasks, 27.5 hours - Core features
- **P2 (Medium)**: 10 tasks, 12.5 hours - Polish
- **P3 (Low)**: 1 task, 1.0 hour - Nice-to-have

### By Phase
1. **Critical Bugs** (T001-T006): 5.0 hours
2. **Movies/TV Pages** (T007-T012): 10.5 hours
3. **Detail Pages** (T013-T016): 5.5 hours
4. **Search UX** (T017-T019): 5.5 hours
5. **Theme Polish** (T020-T023): 6.5 hours
6. **Testing** (T024-T027): 9.0 hours
7. **Build & Report** (T028-T031): 2.0 hours

---

## 🎯 Recommended Implementation Order

### Day 1: Critical Bug Fixes (3-4 hours)
- Fix sidebar collapse button rendering
- Fix download panel light mode visibility
- Change "Start" to "Download"
- Add manual torrent selection
- Show full torrent details
- Add TV episode quality selection

**Deliverable**: Download panel works perfectly in both themes, sidebar labels render

### Day 2: Movies & TV Pages Foundation (6-7 hours)
- Add Movies/TV tabs to sidebar
- Create MoviesView with infinite scroll
- Create TVSeriesView with infinite scroll
- Build reusable FilterPanel component

**Deliverable**: `/movies` and `/tv-series` pages functional with basic infinite scroll

### Day 3: Filters & Detail Pages (6-7 hours)
- Add filters to Movies/TV pages
- Enhance MovieDetailView with all metadata
- Enhance TVDetailView with all metadata
- Add "Similar" carousel component

**Deliverable**: Complete Movies/TV browsing experience, detail pages comprehensive

### Day 4: Search & Theme Polish (6-7 hours)
- Implement SearchTypeahead component
- Integrate typeahead into Header
- Fix remaining hardcoded dark styles
- Improve sidebar logo

**Deliverable**: Search works from any page, light theme perfect everywhere

### Day 5: Testing (6-7 hours)
- Write unit tests for download selection
- Write unit tests for search typeahead
- Write integration tests for infinite scroll
- Write integration test for theme propagation

**Deliverable**: Test suite passing, bugs caught early

### Day 6: QA & Screenshots (3-4 hours)
- Run development build
- Manual QA on all pages
- Capture screenshots (light/dark)
- Document remaining issues
- Create final status report

**Deliverable**: Screenshot report with all pages, blockers documented

---

## 🔍 Technical Notes

### API Endpoints Needed
- `metadataApi.getPopular(mediaType, page)` - For Movies/TV listing
- `metadataApi.search(query, options)` - For search typeahead
- `metadataApi.getSimilar(id, mediaType)` - For similar content carousel
- Verify: These endpoints exist in backend or need to be created

### Component Architecture
```
New Components:
- MoviesView.tsx          // Movies listing page
- TVSeriesView.tsx        // TV series listing page
- FilterPanel.tsx         // Reusable filter sidebar
- SearchTypeahead.tsx     // Inline search suggestions
- SimilarCarousel.tsx     // Horizontal scrolling carousel

Enhanced Components:
- Sidebar.tsx             // Add Movies/TV nav items
- DownloadPanel.tsx       // Fix light mode, add selection UI
- EpisodeSelector.tsx     // Add per-episode quality
- MovieDetailView.tsx     // Add metadata, similar carousel
- TVDetailView.tsx        // Add metadata, similar carousel
```

### State Management Considerations
- Filter state: Use URL query params + localStorage
- Scroll position: Save to sessionStorage, restore on back navigation
- Selected torrents: Local component state (no global store needed)
- Search results: Debounced local state, clear on navigation

---

## ⚠️ Potential Blockers

### API Availability
- Need to verify TMDB API supports:
  - Pagination for popular movies/TV
  - Genre filtering
  - Year/rating filtering
  - Similar/recommended content
- If not available: May need to implement client-side filtering (less ideal)

### Performance Concerns
- Infinite scroll with large datasets may need virtualization
- Consider using `react-window` or `react-virtual` if performance degrades
- Image lazy loading essential for movie cards (use `loading="lazy"`)

### Testing Challenges
- Playwright tests for infinite scroll need viewport scrolling
- Search typeahead debouncing needs careful timing in tests
- Theme propagation test needs to visit all pages (long test)

---

## 📸 Screenshots Needed (After Implementation)

For final report, capture:
1. Home page (light + dark)
2. Movies listing with filters (light + dark)
3. TV Series listing with filters (light + dark)
4. Movie detail page with similar carousel (light + dark)
5. TV detail page with similar carousel (light + dark)
6. Downloads page with active download (light + dark)
7. Library page (light + dark)
8. Settings page (light + dark)
9. Sidebar expanded (light + dark)
10. Sidebar collapsed (light + dark)
11. Download panel modal (light + dark)
12. Episode selector modal (light + dark)
13. Search typeahead dropdown (light + dark)

**Total**: 26 screenshots (13 views × 2 themes)

---

## ✅ Definition of Done

Implementation is complete when:

- [ ] All P0 tasks complete (critical bugs fixed)
- [ ] All P1 tasks complete (core features working)
- [ ] 80% of P2 tasks complete (polish applied)
- [ ] Tests passing (unit + integration)
- [ ] Manual QA completed
- [ ] Screenshots captured and reviewed
- [ ] No console errors in dev build
- [ ] Light theme works everywhere
- [ ] Dark theme works everywhere
- [ ] API calls succeed (or fail gracefully with retry)
- [ ] Accessibility: Keyboard navigation works, ARIA labels present
- [ ] Performance: No jank during scroll, smooth animations
- [ ] Documentation: README and DEVELOPMENT.md updated

---

## 🚦 Status: Awaiting Approval

**Next Step**: Please review `tasks.md` and approve before I begin implementation.

**Questions for User**:
1. Approve tasks.md structure and estimates?
2. Any tasks to add/remove/reprioritize?
3. Should I start with P0 critical bugs immediately?
4. Preference for Movies/TV navigation: Separate nav items or expandable section?
5. Any specific design preferences for sidebar logo?

Once approved, I will begin with **T001: Fix sidebar collapse button rendering** and proceed through the priority order.
