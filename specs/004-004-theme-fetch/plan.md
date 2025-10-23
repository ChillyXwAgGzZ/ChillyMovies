# Implementation Plan: Theme Propagation, Fetch Fixes & UI Polish

**Branch**: `004-004-theme-fetch` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-004-theme-fetch/spec.md`

## Summary

This feature addresses critical UX and functionality issues in the Chilly Movies UI: (1) theme propagation inconsistencies where hardcoded dark styles break the light theme experience, (2) fetch errors on movie and TV detail pages preventing users from viewing TMDB metadata, (3) sidebar UX issues (poor spacing, colors, accessibility), (4) inconsistent visual polish across pages, and (5) accessibility/i18n gaps. The technical approach involves auditing all components for hardcoded theme styles, debugging TMDB API integration, refactoring sidebar component, establishing consistent design tokens, and adding accessibility/i18n validations.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js >=18 LTS  
**Primary Dependencies**: Electron 28.3, React 18.3, Vite 5.4, TailwindCSS 3.4, i18next 23.16, react-router-dom 6.30  
**Storage**: localStorage (theme preferences), TMDB API (media metadata)  
**Testing**: Vitest (unit tests), Playwright (E2E), axe-core (accessibility audits)  
**Target Platform**: Electron desktop app (Windows, macOS, Linux)  
**Project Type**: Single project (Electron + React renderer)  
**Performance Goals**: Theme toggle < 100ms, API responses < 2s, 60fps UI animations  
**Constraints**: WCAG AA accessibility, offline-capable (after initial metadata fetch), bilingual UI (English/Swahili)  
**Scale/Scope**: ~15 UI components, 6 main views, ThemeContext/SidebarContext, TMDB integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Applicable Principles

- **VI. User-First, Accessible, Bilingual UI (MUST)**: This feature directly implements constitutional requirements for accessible, bilingual UI. We will audit all components for WCAG AA compliance, ensure keyboard navigation works throughout, and verify i18n coverage for new/updated UI text. All theme colors must meet contrast ratios in both light and dark modes.

- **III. Modular, Extensible Architecture (MUST)**: Theme management is already modular via ThemeContext. This feature refactors components to respect that contract. Sidebar and component styling will be isolated and reusable. No cross-cutting style dependencies should be introduced.

- **I. Desktop-First, Local-First (NON-NEGOTIABLE)**: Theme preferences are stored in localStorage (local-first). TMDB API calls respect offline-first principles: data is fetched on-demand and should be cacheable. This feature does not introduce cloud dependencies.

### Deviations and Tradeoffs

None. This feature strengthens constitutional compliance rather than deviating from it.

### Required Follow-Ups

1. **Accessibility Audit**: Run axe-core audit on all pages after visual polish is complete. Document and fix any critical/serious issues before merging.
2. **i18n Coverage**: Verify all new UI text (error messages, loading states, empty states) has English and Swahili translations. Add missing keys to i18n files.
3. **Theme Contrast Validation**: Use browser DevTools or automated tools to verify WCAG AA contrast ratios for all text/background combinations in both themes.

## Project Structure

### Documentation (this feature)

```
specs/004-004-theme-fetch/
├── plan.md              # This file
├── spec.md              # Feature specification with user stories
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```
src/
├── renderer/
│   ├── App.tsx                    # Main app component (already has ThemeProvider)
│   ├── context/
│   │   ├── ThemeContext.tsx       # Existing theme management (working)
│   │   └── SidebarContext.tsx     # Existing sidebar state
│   ├── components/
│   │   ├── Sidebar.tsx            # NEEDS REFACTOR: colors, spacing, a11y
│   │   ├── Header.tsx             # NEEDS AUDIT: theme propagation
│   │   ├── DownloadPanel.tsx      # NEEDS AUDIT: theme propagation
│   │   ├── EpisodeSelector.tsx    # NEEDS AUDIT: theme propagation, modal styles
│   │   └── Toast.tsx              # NEEDS AUDIT: theme propagation
│   ├── views/
│   │   ├── HomeView.tsx           # NEEDS AUDIT: theme propagation
│   │   ├── MovieDetailView.tsx    # NEEDS FIX: fetch errors, theme audit
│   │   ├── TVDetailView.tsx       # NEEDS FIX: fetch errors, theme audit
│   │   ├── DownloadsView.tsx      # NEEDS AUDIT: theme propagation
│   │   ├── LibraryView.tsx        # NEEDS AUDIT: theme propagation
│   │   └── SettingsView.tsx       # NEEDS AUDIT: theme propagation, hardcoded dark styles
│   ├── services/
│   │   └── api.ts                 # NEEDS INVESTIGATION: TMDB fetch logic
│   └── i18n.ts                    # Existing i18n setup

tests/
├── accessibility/                  # NEW: E2E accessibility tests
│   └── theme-contrast.test.ts
├── integration/
│   ├── movie-detail.test.ts       # NEW: Test TMDB fetch for movies
│   └── tv-detail.test.ts          # NEW: Test TMDB fetch for TV shows
└── unit/
    └── theme-context.test.ts       # NEW: Unit tests for theme persistence
```

**Structure Decision**: This is a single Electron project with React renderer. All UI code lives under `src/renderer/`. We will audit and refactor existing components rather than adding new ones. Tests will be added in appropriate directories (accessibility, integration, unit).

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations. This feature strengthens existing constitutional compliance (accessibility, modularity, local-first).
