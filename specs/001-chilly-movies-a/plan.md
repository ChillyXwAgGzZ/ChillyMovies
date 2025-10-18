# Implementation Plan: Cinematic UI Overhaul

**Branch**: `001-chilly-movies-a` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Create a new cinematic UI for the app, using the provided HTML as a visual reference. Remove old UI components and ensure all existing functionality is integrated.

## Summary

This plan outlines the implementation of a new cinematic user interface for the Chilly Movies application. The goal is to replace the existing UI with a modern, professional, and fully functional interface inspired by the provided visual reference. This involves removing old/redundant UI components, implementing a new component library using Tailwind CSS, and ensuring all existing application features (discovery, downloads, library, settings, bilingual support) are seamlessly integrated.

## Technical Context

**Language/Version**: TypeScript (>=4.9), React (>=18)
**Primary Dependencies**: Electron, Node.js (>=18 LTS), React, Tailwind CSS, `react-router-dom`, `i18next`
**Storage**: Local filesystem, `chilly.db.json` for library index.
**Testing**: Vitest, Playwright, React Testing Library.
**Target Platform**: Desktop (Windows, macOS, Linux) via Electron.
**Project Type**: Single project (Electron app with a `src/renderer` frontend).
**Performance Goals**: Smooth 60fps animations, responsive UI across standard desktop resolutions.
**Constraints**: Must adhere to a local-first, offline-capable architecture.
**Scale/Scope**: UI must be performant for libraries of up to 10,000 items.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature plan adheres to the project constitution (`.specify/memory/constitution.md`).

- **I. Desktop-First, Local-First**: Applies. The new UI is the primary interface for the local-first application. All components will be designed to work with local data and state, ensuring full offline functionality.
- **II. Explicit Legal & Ethical Compliance**: Applies. The UI will present information clearly and will not mislead users. Any features requiring legal disclaimers will have clear, designated areas in the UI.
- **III. Modular, Extensible Architecture**: Applies. The UI will be built using a modular component-based architecture in React, replacing the previous set of components with a new, more consistent library.
- **IV. Responsible Source Integration**: Applies. The UI will clearly distinguish between different content sources (e.g., TMDB for metadata, user-provided links for downloads).
- **VI. User-First, Accessible, Bilingual UI**: **Directly applies and is the core of this task.** The new UI is designed to be modern, cinematic, and accessible. It will fully support and persist the existing Swahili/English bilingual functionality.
- **VII. AI Assistance Is Assistive, Not Autonomous**: Not directly applicable to this UI overhaul, but the modular design will allow for future AI components to be added in an assistive, opt-in manner.

**Result**: No constitutional violations. The plan proceeds.

## Project Structure

### Documentation (this feature)

```
specs/001-chilly-movies-a/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)
The existing project structure will be maintained. The focus of this work is within the `src/renderer` directory.

```
src/
├── main/                  # Electron main process (backend) - NO CHANGES
├── preload/               # Electron preload script - NO CHANGES
└── renderer/              # Electron renderer process (frontend/UI) - ALL CHANGES HERE
    ├── components/      # New reusable React components for the cinematic UI
    ├── views/           # Application views (Home, Downloads, etc.) using new components
    ├── assets/          # Fonts, icons, and images
    ├── styles/          # Global styles and Tailwind CSS setup
    └── main.tsx         # Renderer entry point
tests/
└── renderer/              # Tests for new UI components and views
```

**Structure Decision**: The implementation will replace the contents of `src/renderer` with the new cinematic UI, leveraging the existing, sound project structure. The previous cinematic UI components will be removed and replaced by a new set based on the new design.

## Complexity Tracking

*Not applicable, as no constitutional violations were identified.*

