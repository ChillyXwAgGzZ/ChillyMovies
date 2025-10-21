---
description: "Task list for Theme Propagation, Fetch Fixes & UI Polish"
---

# Tasks: Theme Propagation, Fetch Fixes & UI Polish

**Input**: Design documents from `/specs/004-004-theme-fetch/`
**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project setup and investigation

- [x] T001 [P] Run theme audit: grep all src/renderer files for hardcoded dark styles (`bg-gray-800`, `text-white`, etc.)
- [ ] T002 [P] Reproduce movie/TV detail page fetch errors: navigate to `/movie/550` and `/tv/1396`, capture network logs
- [ ] T003 [P] Analyze current sidebar code in `src/renderer/components/Sidebar.tsx` for UX issues

**Checkpoint**: Issues documented, ready to fix

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core fixes that enable user story work

**⚠️ CRITICAL**: Theme propagation work blocks all visual polish tasks

- [x] T004 Verify ThemeContext is working: test theme persistence in localStorage, check if `actualTheme` updates correctly
- [ ] T005 Investigate TMDB API integration in `src/renderer/services/api.ts`: check endpoint construction, error handling, CORS setup
- [ ] T006 Fix TMDB API calls in `metadataApi.getDetails()` if root cause is backend (endpoint mismatch, missing API key, etc.)

**Checkpoint**: Foundation ready - theme system validated, API integration debugged

---

## Phase 3: User Story 1 - Consistent Theme Experience (Priority: P1) 🎯 MVP

**Goal**: All UI elements respect user's theme choice without hardcoded dark styles

**Independent Test**: Toggle theme in Settings, navigate to all pages/modals, verify light theme displays correctly everywhere

### Implementation for User Story 1

- [x] T007 [P] [US1] Refactor `src/renderer/views/SettingsView.tsx`: replace hardcoded `bg-gray-800`, `text-white` with theme-aware classes (`bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`)
- [x] T008 [P] [US1] Refactor `src/renderer/components/Header.tsx`: audit and replace any hardcoded dark styles with theme-aware classes
- [x] T009 [P] [US1] Refactor `src/renderer/components/Sidebar.tsx`: replace hardcoded dark styles with theme-aware classes (will be further refined in US3)
- [x] T010 [P] [US1] Refactor `src/renderer/components/DownloadPanel.tsx`: audit and fix theme propagation
- [x] T011 [P] [US1] Refactor `src/renderer/components/EpisodeSelector.tsx`: modal background, text, form controls must respect theme
- [x] T012 [P] [US1] Refactor `src/renderer/components/Toast.tsx`: audit toast component for theme-aware styles
- [x] T013 [P] [US1] Refactor `src/renderer/views/HomeView.tsx`: audit and fix any hardcoded dark styles
- [x] T014 [P] [US1] Refactor `src/renderer/views/LibraryView.tsx`: audit and fix theme propagation
- [x] T015 [P] [US1] Refactor `src/renderer/views/DownloadsView.tsx`: audit and fix theme propagation
- [x] T016 [P] [US1] Refactor `src/renderer/views/MovieDetailView.tsx`: fix back button hover colors
- [x] T017 [P] [US1] Refactor `src/renderer/views/TVDetailView.tsx`: fix back button hover colors
- [x] T018 [P] [US1] Refactor `src/renderer/components/MovieCard.tsx`: make card background, title, year, and rating theme-aware
- [ ] T019 [US1] Manual test: toggle theme to light, visit all pages, verify no dark backgrounds leak through
- [ ] T020 [US1] Test theme persistence: set light theme, close app, reopen, verify light theme is restored

**Checkpoint**: Theme propagates correctly to all UI elements, persists across sessions

---

## Phase 4: User Story 2 - Reliable Movie & TV Detail Pages (Priority: P1)

**Goal**: Movie and TV detail pages load TMDB data without fetch errors

**Independent Test**: Navigate to `/movie/550` (Fight Club) and `/tv/1396` (Breaking Bad), verify metadata loads successfully

### Tests for User Story 2 (integration tests)

- [x] T021 [P] [US2] Create `tests/integration/movie-detail.test.ts`: test fetching movie details from TMDB API, verify response structure
- [x] T022 [P] [US2] Create `tests/integration/tv-detail.test.ts`: test fetching TV show details and seasons from TMDB API, verify response structure

### Implementation for User Story 2

- [x] T023 [US2] Fix `src/renderer/views/MovieDetailView.tsx`: ensure `metadataApi.getDetails(id, "movie")` handles errors gracefully, add proper loading/error states
- [x] T024 [US2] Fix `src/renderer/views/TVDetailView.tsx`: ensure `metadataApi.getDetails(id, "tv")` and `metadataApi.getTVSeasons(id)` handle errors gracefully
- [x] T025 [US2] Add retry logic in `src/renderer/services/api.ts` with exponential backoff (max 3 retries, 1s initial delay, 10s max delay)
- [x] T026 [US2] Improve error messages: distinguish between network errors, rate limits, 404s, server errors, and client errors with user-friendly messages
- [ ] T027 [US2] Test with known TMDB IDs: movie/550, tv/1396, verify data loads, posters/backdrops display, ratings show correctly
- [ ] T028 [US2] Test error handling: simulate network failure, verify error message and retry button work

**Checkpoint**: Movie and TV detail pages load reliably, with proper loading/error UX

---

## Phase 5: User Story 3 - Modern, Accessible Sidebar Navigation (Priority: P2)

**Goal**: Sidebar has clear visual hierarchy, proper spacing, theme-aware colors, and is keyboard-accessible

**Independent Test**: Navigate sidebar with Tab/Enter, verify focus indicators, check contrast ratios in light/dark themes

### Tests for User Story 3 (accessibility tests)

- [ ] T026 [P] [US3] Create `tests/accessibility/sidebar-navigation.test.ts`: Playwright test for keyboard navigation (Tab through sidebar items, Enter to activate)
- [ ] T027 [P] [US3] Create `tests/accessibility/sidebar-contrast.test.ts`: axe-core audit for sidebar contrast ratios in light and dark themes

### Implementation for User Story 3

- [ ] T028 [US3] Refactor `src/renderer/components/Sidebar.tsx` layout: improve spacing (consistent padding, margins between items)
- [ ] T029 [US3] Refactor Sidebar colors: use theme-aware variables, ensure active item is clearly highlighted
- [ ] T030 [US3] Add hover states to Sidebar items: background color change on hover, smooth transition
- [ ] T031 [US3] Implement keyboard focus indicators: visible focus ring on Tab navigation, support Enter key activation
- [ ] T032 [US3] Add ARIA labels to Sidebar navigation items (`aria-label` or `aria-labelledby`, `role="navigation"`)
- [ ] T033 [US3] Test active route highlighting: navigate to different pages, verify current page is highlighted in Sidebar
- [ ] T034 [US3] Run axe-core audit on Sidebar, fix any contrast or accessibility issues
- [ ] T035 [US3] Test responsive behavior: resize window to mobile width, verify Sidebar adapts (or plan hamburger menu if needed)

**Checkpoint**: Sidebar is accessible, visually polished, and responsive

---

## Phase 6: User Story 4 - Visual Polish Across All Pages (Priority: P3)

**Goal**: Consistent spacing, typography, button styles, and layout across all views

**Independent Test**: Navigate through all pages, compare spacing/font sizes/button styles, verify cohesion

### Implementation for User Story 4

- [ ] T036 [P] [US4] Establish design tokens in `src/renderer/index.css` or Tailwind config: consistent spacing scale, typography scale, button styles
- [ ] T037 [P] [US4] Refactor HomeView: apply consistent spacing, heading styles, card layouts
- [ ] T038 [P] [US4] Refactor LibraryView: apply consistent spacing, add empty state message if library is empty
- [ ] T039 [P] [US4] Refactor DownloadsView: apply consistent spacing, polish progress bars, status text
- [ ] T040 [P] [US4] Refactor MovieDetailView: consistent spacing, typography, button styles
- [ ] T041 [P] [US4] Refactor TVDetailView: consistent spacing, typography, button styles
- [ ] T042 [P] [US4] Refactor SettingsView: consistent spacing, form control styles
- [ ] T043 [US4] Add empty state messages: Library (no movies yet), Downloads (no active downloads), Home (no search results)
- [ ] T044 [US4] Polish loading states: consistent spinner component, use across all views
- [ ] T045 [US4] Manual review: navigate all pages, verify visual consistency (spacing, fonts, colors)

**Checkpoint**: All pages have consistent, polished UI

---

## Phase 7: User Story 5 - Accessibility & Internationalization (Priority: P3)

**Goal**: All interactive elements are keyboard-accessible, have ARIA labels, and support bilingual UI (English/Swahili)

**Independent Test**: Keyboard-only navigation, axe-core audit, toggle language to Swahili

### Tests for User Story 5 (accessibility + i18n tests)

- [ ] T046 [P] [US5] Create `tests/accessibility/keyboard-navigation.test.ts`: Playwright test for full keyboard navigation flow (Tab through app, activate all interactive elements)
- [ ] T047 [P] [US5] Create `tests/accessibility/axe-audit.test.ts`: Run axe-core on all main pages (Home, Library, Downloads, Settings, Detail pages)
- [ ] T048 [P] [US5] Create `tests/integration/i18n.test.ts`: Test language toggle in Settings, verify UI text switches to Swahili

### Implementation for User Story 5

- [ ] T049 [P] [US5] Audit all interactive elements (buttons, links, form controls) for keyboard accessibility: add `tabIndex`, `onKeyDown` handlers if needed
- [ ] T050 [P] [US5] Add ARIA labels to all icon-only buttons (e.g., play button, download button, search button): `aria-label="Play trailer"`
- [ ] T051 [P] [US5] Add ARIA roles to semantic sections: `role="navigation"` for Sidebar, `role="main"` for main content area
- [ ] T052 [P] [US5] Verify logical focus order: Tab should move through UI in intuitive sequence (Sidebar → Header → Main content)
- [ ] T053 [US5] Run axe-core audit on all pages, document results, fix all critical and serious issues (contrast, missing labels, keyboard traps)
- [ ] T054 [US5] Audit i18n coverage: check `src/renderer/i18n.ts` for missing translation keys, add English/Swahili translations for new UI text (error messages, loading states, empty states)
- [ ] T055 [US5] Test language toggle: switch language in Settings, navigate all pages, verify text displays in Swahili (or fallback to English if missing)
- [ ] T056 [US5] Validate WCAG AA contrast ratios: use DevTools or automated tools to check text/background contrast in both themes, fix violations

**Checkpoint**: App is fully accessible (keyboard, ARIA, contrast) and bilingual (English/Swahili)

---

## Phase 8: Polish & Final Validation

**Purpose**: Final tests and documentation

- [ ] T057 [P] Run full E2E test suite: verify all user stories work end-to-end
- [ ] T058 [P] Update `docs/TROUBLESHOOTING_BLUE_SCREEN.md` or similar if new edge cases discovered
- [ ] T059 [P] Add inline code comments for any complex theme logic or API error handling
- [ ] T060 Manual smoke test: fresh app launch, test theme toggle, browse movies, download an episode, verify no regressions
- [ ] T061 Run performance check: theme toggle should be <100ms, page transitions smooth (60fps)
- [ ] T062 Update `.github/copilot-instructions.md` with any new conventions (theme-aware class patterns, accessibility requirements)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - HIGH PRIORITY (theme propagation is foundational for polish)
- **User Story 2 (Phase 4)**: Depends on Foundational - HIGH PRIORITY (fetch fixes are critical for app functionality), can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on US1 completion (sidebar needs theme fixes first)
- **User Story 4 (Phase 6)**: Depends on US1 completion (visual polish needs consistent theme)
- **User Story 5 (Phase 7)**: Depends on US3 and US4 completion (a11y audit after layout/styling stable)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Recommended Execution Order

1. **Phase 1 (Setup)**: T001-T003 - Run audits and investigation (1-2 hours)
2. **Phase 2 (Foundational)**: T004-T006 - Fix theme/API issues (2-4 hours)
3. **Phase 3 (US1 - Theme Propagation)**: T007-T017 - Fix all theme issues (4-6 hours)
4. **Phase 4 (US2 - Fetch Fixes)**: T018-T025 - Fix movie/TV detail pages (3-4 hours) [Can run in parallel with US1]
5. **Phase 5 (US3 - Sidebar Redesign)**: T026-T035 - Refactor sidebar (3-4 hours)
6. **Phase 6 (US4 - Visual Polish)**: T036-T045 - Polish all pages (4-6 hours)
7. **Phase 7 (US5 - Accessibility & i18n)**: T046-T056 - Accessibility and i18n validation (3-4 hours)
8. **Phase 8 (Final Polish)**: T057-T062 - Final tests and docs (2-3 hours)

**Total Estimated Effort**: 22-34 hours

### Parallel Opportunities

- **Phase 1**: All tasks (T001-T003) can run in parallel
- **Phase 2**: Tasks T004 and T005-T006 can run in parallel (theme validation vs. API investigation)
- **Phase 3**: All component refactors (T007-T015) can run in parallel if multiple developers available
- **Phase 4**: Tests (T018-T019) can run in parallel, then implementation tasks (T020-T023) in sequence
- **Phase 5**: Tests (T026-T027) can run in parallel, implementation tasks (T028-T035) mostly sequential
- **Phase 6**: All view refactors (T036-T042) can run in parallel
- **Phase 7**: Tests (T046-T048) and some implementation tasks (T049-T052) can run in parallel
- **Phase 8**: T057-T059 can run in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Theme propagation (US1) blocks visual polish work (US4) - fix theme first
- Fetch fixes (US2) are independent and can proceed in parallel with theme work
- Commit after each task or logical group
- Stop at each checkpoint to validate story independently
