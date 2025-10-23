# Feature Specification: Theme Propagation, Fetch Fixes & UI Polish

**Feature Branch**: `004-004-theme-fetch`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "Fix theme propagation across all UI components, resolve movie/TV detail page fetch errors, redesign sidebar for better UX, polish pages with consistent styling, and ensure accessibility/i18n compliance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Theme Experience (Priority: P1)

Users should experience a consistent visual theme (light or dark) across all UI elements when they toggle the theme preference in settings. The theme should persist across sessions and apply to all pages, components, modals, and nested elements without any hardcoded dark styles.

**Why this priority**: Theme consistency is foundational for good UX. Hardcoded styles break the user's chosen preference and create a jarring, unprofessional experience. This must be fixed before visual polish work can proceed.

**Independent Test**: Toggle theme in Settings. Navigate to Home, Library, Downloads, Settings tabs and open any modal or detail page. All elements should reflect the chosen theme with no hardcoded dark backgrounds or light text breaking through.

**Acceptance Scenarios**:

1. **Given** user is on any page, **When** user selects "Light" theme in Settings, **Then** all UI elements (pages, sidebar, header, modals, buttons, cards) use light theme colors
2. **Given** user has set theme preference, **When** user closes and reopens app, **Then** theme preference is restored from localStorage
3. **Given** user is in dark mode, **When** user opens Settings modal, **Then** modal background, text, and form controls all respect dark theme

---

### User Story 2 - Reliable Movie & TV Detail Pages (Priority: P1)

Users should be able to view full movie and TV show details without fetch errors. Detail pages must load real TMDB data with proper loading states, error handling, and retry mechanisms.

**Why this priority**: Broken detail pages render the app non-functional for its core use case (browsing and downloading media). This is a critical bug blocking user value.

**Independent Test**: Navigate to any movie or TV detail page from search results. Page should load TMDB metadata (poster, title, overview, rating) without "failed to fetch, retry" errors. Test with known TMDB IDs (e.g., movie/550 for Fight Club, tv/1396 for Breaking Bad).

**Acceptance Scenarios**:

1. **Given** user clicks a movie card, **When** detail page loads, **Then** movie metadata (title, poster, backdrop, rating, overview) displays without fetch errors
2. **Given** TMDB API is slow, **When** detail page loads, **Then** loading spinner is shown until data arrives
3. **Given** TMDB API returns error, **When** detail page fails, **Then** user sees friendly error message with retry button
4. **Given** user is on TV detail page, **When** seasons/episodes data is fetched, **Then** Episode Selector displays available seasons and episodes

---

### User Story 3 - Modern, Accessible Sidebar Navigation (Priority: P2)

Users should navigate the app via a well-designed sidebar with clear visual hierarchy, proper spacing, hover states, and theme-aware colors. Sidebar should be responsive and accessible (keyboard navigation, ARIA labels, focus states).

**Why this priority**: The sidebar is the primary navigation element. A poorly designed sidebar harms overall UX and accessibility. This should be addressed after critical functionality (theme, fetch) is stable.

**Independent Test**: Use keyboard Tab/Enter to navigate sidebar. Check contrast ratios in both light/dark themes. Resize window to test responsive behavior.

**Acceptance Scenarios**:

1. **Given** user hovers over sidebar item, **When** pointer enters item area, **Then** background color changes to indicate interactivity
2. **Given** user is on Downloads page, **When** sidebar renders, **Then** Downloads item is visually highlighted as active
3. **Given** user uses keyboard navigation, **When** Tab key focuses sidebar item, **Then** focus ring is visible and item can be activated with Enter
4. **Given** user has chosen light theme, **When** sidebar renders, **Then** background, text, and icons use appropriate light theme colors with sufficient contrast (WCAG AA)

---

### User Story 4 - Visual Polish Across All Pages (Priority: P3)

All pages (Home, Library, Downloads, Settings, Movie/TV Detail) should have consistent spacing, typography, button styles, and layout. Loading states, empty states, and error states should be polished and informative.

**Why this priority**: Visual polish improves perceived quality and usability. This is important but can be done after core functionality and navigation are fixed.

**Independent Test**: Navigate through all pages. Compare spacing, font sizes, button styles, card layouts. All should feel cohesive and intentional.

**Acceptance Scenarios**:

1. **Given** user is on any page, **When** page loads, **Then** headings, body text, buttons, and cards use consistent typography scale and spacing
2. **Given** user is on empty Library page, **When** page renders, **Then** friendly empty state message with call-to-action is displayed
3. **Given** user is on Downloads page with active downloads, **When** progress updates, **Then** progress bars and status text are clearly visible and theme-appropriate

---

### User Story 5 - Accessibility & Internationalization (Priority: P3)

All interactive elements should be keyboard-accessible, have proper ARIA labels, and support bilingual UI (English/Swahili). Color contrast should meet WCAG AA standards in both themes.

**Why this priority**: Accessibility and i18n are constitutional requirements. They should be validated after layout and styling are stable.

**Independent Test**: Use keyboard-only navigation. Run axe-core accessibility audit. Toggle language between English and Swahili to verify translations.

**Acceptance Scenarios**:

1. **Given** user navigates with keyboard only, **When** Tab key is pressed, **Then** focus order is logical and all interactive elements are reachable
2. **Given** user changes language to Swahili in Settings, **When** any page renders, **Then** all UI text (labels, buttons, headings, messages) displays in Swahili
3. **Given** user runs accessibility audit, **When** audit completes, **Then** no critical or serious issues are reported (color contrast, missing labels, keyboard traps)

---

### Edge Cases

- What happens when TMDB API rate limit is hit? (Should show rate limit message, not generic error)
- How does theme toggle behave when system theme changes while app is open? (Should respect user's explicit choice over system preference)
- What happens when user resizes window to mobile width? (Sidebar should collapse or transform to hamburger menu)
- How does app handle missing translations for new features? (Should fallback to English)
- What happens when localStorage is unavailable? (Should default to dark theme and continue working)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST apply user-selected theme (light/dark) to all UI components including pages, modals, sidebar, header, buttons, cards, and form controls
- **FR-002**: System MUST persist theme preference in localStorage and restore on app launch
- **FR-003**: System MUST remove all hardcoded dark mode styles (e.g., `bg-gray-800`, `text-white`) and replace with theme-aware classes (e.g., `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`)
- **FR-004**: System MUST successfully fetch movie details from TMDB API for MovieDetailView without errors
- **FR-005**: System MUST successfully fetch TV show details and seasons from TMDB API for TVDetailView without errors
- **FR-006**: System MUST display loading spinner during API calls and proper error states with retry button on failure
- **FR-007**: Sidebar MUST highlight active navigation item based on current route
- **FR-008**: Sidebar MUST be keyboard-navigable with visible focus indicators
- **FR-009**: Sidebar MUST use theme-aware colors with WCAG AA contrast ratios in both light and dark modes
- **FR-010**: All pages MUST use consistent spacing, typography, and component styles
- **FR-011**: All interactive elements MUST have proper ARIA labels and roles
- **FR-012**: All UI text MUST support bilingual display (English/Swahili) via i18n system
- **FR-013**: System MUST handle TMDB API rate limit errors with specific user-facing message
- **FR-014**: System MUST fallback to English when translations are missing

### Key Entities *(include if feature involves data)*

- **Theme Preference**: User's chosen theme (`light`, `dark`, or `system`), persisted in localStorage
- **Media Metadata**: Movie or TV show data fetched from TMDB API (title, poster, backdrop, rating, overview, release date)
- **TV Season**: Season data for TV shows (season number, episode count, air date)
- **Navigation State**: Current active route for sidebar highlighting

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle between light and dark themes in Settings and see changes reflected across all UI elements within 100ms
- **SC-002**: Movie and TV detail pages load TMDB data successfully 95% of the time (excluding actual API outages)
- **SC-003**: Accessibility audit (axe-core) reports zero critical or serious issues on all pages
- **SC-004**: All interactive elements are keyboard-navigable in logical tab order
- **SC-005**: Color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text) in both themes
- **SC-006**: Theme preference persists across app restarts with 100% reliability
- **SC-007**: All user-facing text displays correctly in both English and Swahili when language is toggled
