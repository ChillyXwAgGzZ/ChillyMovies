# UI Integration Tasks - Phase 5: Live Data & Functionality

**Goal**: Replace all mock/static data with live backend integration, add missing pages, and create a fully functional cinematic UI.

**Status**: Planning → Implementation  
**Branch**: `001-chilly-movies-a`  
**Estimated Total**: ~16-20 hours

---

## Priority 1: Core Data Integration (Est: 6-8 hours)

### Task 1.1: API Client & Service Layer
- [x] Create `src/renderer/services/api.ts` with typed fetch wrappers for all backend endpoints
- [x] Add error handling, retry logic, and loading states
- [x] Create TypeScript interfaces matching backend API contracts
- [x] Add API base URL configuration (localhost:3000 for dev)
- **Est**: 2 hours
- **Dependencies**: None
- **Test**: Verify `/metadata/search` returns typed results ✅

### Task 1.2: Home Page - Popular Content
- [x] Add `/metadata/popular` endpoint to backend (if missing) OR use TMDB discover endpoint
- [x] Update `HomeView.tsx` to fetch and display popular movies
- [x] Add popular TV series section
- [x] Implement loading skeletons and error states
- [x] Add auto-refresh on mount
- **Est**: 2 hours
- **Dependencies**: Task 1.1
- **Test**: Home page loads real TMDB popular titles on page load ✅

### Task 1.3: Search Integration
- [x] Wire Header search input to `/metadata/search?q=...&type=...`
- [x] Implement debounced search (300ms delay)
- [x] Add loading spinner in search results area
- [x] Display search results with real movie cards
- [x] Handle empty results and error states
- [ ] Add search type toggle (Movies/TV/All) - DEFERRED
- **Est**: 2 hours
- **Dependencies**: Task 1.1
- **Test**: Typing "Inception" returns real TMDB results within 500ms ✅

---

## Priority 2: Detail Pages & Navigation (Est: 5-6 hours)

### Task 2.1: Movie Detail Page
- [ ] Create `src/renderer/views/MovieDetailView.tsx`
- [ ] Add route `/movie/:id` in App.tsx
- [ ] Fetch movie details from `/metadata/movie/:id`
- [ ] Display: poster, title, overview, year, rating, runtime, genres
- [ ] Add "Download" button (calls `/download/start`)
- [ ] Add "Watch Trailer" button (fetches `/metadata/movie/:id/trailers`)
- [ ] Implement breadcrumb navigation (Home > Movie Details)
- **Est**: 2.5 hours
- **Dependencies**: Task 1.1
- **Test**: Clicking a movie card opens detail page with real metadata

### Task 2.2: TV Series Detail Page
- [ ] Create `src/renderer/views/TVSeriesDetailView.tsx`
- [ ] Add route `/tv/:id` in App.tsx
- [ ] Fetch series details from `/metadata/tv/:id`
- [ ] Display series overview, seasons list
- [ ] Add episode list per season (expandable/collapsible)
- [ ] Add per-episode download buttons
- [ ] Handle multi-season navigation
- **Est**: 2.5 hours
- **Dependencies**: Task 1.1
- **Test**: Clicking a TV series opens detail page with seasons/episodes

### Task 2.3: Navigation Updates
- [ ] Update Sidebar to link to new routes
- [ ] Add "Back" button to detail pages
- [ ] Ensure breadcrumb navigation works
- [ ] Update active route highlighting in Sidebar
- **Est**: 0.5 hours
- **Dependencies**: Tasks 2.1, 2.2
- **Test**: All sidebar links navigate correctly

---

## Priority 3: Downloads & Progress Tracking (Est: 4-5 hours)

### Task 3.1: Download Actions
- [ ] Implement download start: POST `/download/start` with payload `{tmdb_id, media_type, title}`
- [ ] Add download confirmation modal/toast
- [ ] Handle download errors (quota, disk space, network)
- [ ] Show success feedback with link to Downloads page
- **Est**: 1.5 hours
- **Dependencies**: Task 1.1
- **Test**: Clicking "Download" button starts a real download job

### Task 3.2: Downloads View - Real-time Progress (SSE)
- [ ] Create EventSource connection to `/events/:id` for each active download
- [ ] Update DownloadsView to display real download progress
- [ ] Show: percentage, speed (MB/s), ETA, peers (for torrents)
- [ ] Handle SSE reconnection on disconnect
- [ ] Add cleanup on component unmount
- **Est**: 2 hours
- **Dependencies**: Task 3.1
- **Test**: Starting download shows live progress updates via SSE

### Task 3.3: Download Controls
- [ ] Add Pause button → POST `/download/pause`
- [ ] Add Resume button → POST `/download/resume`
- [ ] Add Cancel button with confirmation → POST `/download/cancel`
- [ ] Update UI state based on action responses
- [ ] Handle action errors gracefully
- **Est**: 1 hour
- **Dependencies**: Task 3.2
- **Test**: Pause/Resume/Cancel buttons work and update download state

---

## Priority 4: Library Integration (Est: 2-3 hours)

### Task 4.1: Library Data Loading
- [ ] Add GET `/library` endpoint to backend (if missing) OR read from storage
- [ ] Update LibraryView to fetch and display downloaded items
- [ ] Show: title, poster, download date, file size
- [ ] Handle empty library state
- [ ] Add filter/sort options (by date, title, type)
- **Est**: 1.5 hours
- **Dependencies**: Task 1.1
- **Test**: Library shows all downloaded media items

### Task 4.2: Library Actions
- [ ] Add "Play" button → opens media player (placeholder for now)
- [ ] Add "Details" button → navigates to detail page
- [ ] Add "Delete" button with confirmation
- [ ] Implement library item re-linking for missing files
- **Est**: 1 hour
- **Dependencies**: Task 4.1
- **Test**: Library actions navigate/trigger correctly

---

## Priority 5: UI Polish & Accessibility (Est: 3-4 hours)

### Task 5.1: Language Switching
- [ ] Verify all new views use `useTranslation` hook
- [ ] Add missing translation keys for new pages (movie detail, TV detail, etc.)
- [ ] Test language toggle switches all UI strings
- [ ] Ensure language preference persists
- **Est**: 1 hour
- **Dependencies**: Tasks 2.1, 2.2
- **Test**: Switching language updates all visible text

### Task 5.2: Loading & Error States
- [ ] Add loading skeletons for all data-fetching views
- [ ] Implement error boundaries for each route
- [ ] Add retry buttons on error states
- [ ] Ensure offline mode shows cached data when available
- **Est**: 1.5 hours
- **Dependencies**: All data tasks
- **Test**: Network errors show proper error UI with retry option

### Task 5.3: Accessibility & UX
- [ ] Add keyboard navigation to all interactive elements
- [ ] Ensure focus indicators are visible
- [ ] Add aria-labels to all buttons/controls
- [ ] Test with screen reader (basic validation)
- [ ] Add hover states to all clickable cards/buttons
- [ ] Ensure color contrast meets WCAG AA
- **Est**: 1 hour
- **Dependencies**: All UI tasks
- **Test**: Tab navigation works, screen reader announces elements

---

## Priority 6: Testing & Validation (Est: 2-3 hours)

### Task 6.1: Frontend Unit Tests
- [ ] Write tests for API service layer (mock fetch)
- [ ] Write tests for search debouncing
- [ ] Write tests for SSE event handling
- [ ] Write tests for download actions
- **Est**: 1.5 hours
- **Dependencies**: Tasks 1.1, 3.1, 3.2
- **Test**: `npm test` passes all new frontend tests

### Task 6.2: Integration Testing
- [ ] Manual test: Search "Inception" → view details → download → see progress
- [ ] Manual test: Navigate to Library → verify downloaded items appear
- [ ] Manual test: Pause/resume/cancel download
- [ ] Manual test: Switch language → verify all UI updates
- [ ] Check browser console for errors
- **Est**: 1 hour
- **Dependencies**: All implementation tasks
- **Test**: Complete user flow works end-to-end

### Task 6.3: Build & Deployment Validation
- [ ] Run `npm run build` and verify no errors
- [ ] Run `npm test` and ensure all tests pass
- [ ] Test in Electron dev mode (`npm run dev`)
- [ ] Verify no console errors in production build
- **Est**: 0.5 hours
- **Dependencies**: All tasks
- **Test**: Production build runs without errors

---

## Out of Scope (Deferred to Phase 6)

- Video player implementation (use placeholder/external player for now)
- Advanced filtering/sorting in Library
- Batch download operations
- Subtitle download/management UI
- Settings page full implementation (storage path, bandwidth limits)
- Export/import library functionality
- Offline sync strategy UI

---

## Risk Assessment

**High Risk**:
- SSE connection stability across network changes
- Download state synchronization between backend and UI
- Handling large library lists (10k+ items) without pagination

**Medium Risk**:
- TMDB API rate limits during testing
- Missing backend endpoints (may need to add `/metadata/popular`, `/library`)
- Translation key coverage for all new UI strings

**Low Risk**:
- UI styling consistency
- TypeScript type mismatches
- Accessibility compliance

---

## Validation Checklist (Pre-completion)

- [ ] Search for "Inception" returns real TMDB results
- [ ] Clicking a movie card opens detail page with metadata
- [ ] Download button starts a real download job
- [ ] Downloads view shows live progress via SSE
- [ ] Pause/Resume/Cancel controls work
- [ ] Library shows downloaded items
- [ ] Language toggle switches all UI text
- [ ] `npm test` passes
- [ ] `npm run build` completes successfully
- [ ] No console errors in production build

---

## Notes

- Backend endpoints are assumed to be available at `http://localhost:3000`
- SSE endpoint `/events/:id` must match download job ID
- TMDB API key must be configured in backend `.env` file
- All new components should follow existing Tailwind/cinematic styling
- Maintain bilingual support (EN/SW) for all new UI strings
