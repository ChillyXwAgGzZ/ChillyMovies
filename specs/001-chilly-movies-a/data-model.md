# Data Model: Cinematic UI

**Date**: 2025-10-18
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)

This document describes the data models for the new cinematic UI. As the UI is the primary focus, these models are primarily concerned with the shape of data as it is presented to and managed by React components. The backend data models remain unchanged.

## 1. Core UI State

This model represents the global state of the UI, which could be managed by a React Context or a state management library.

```typescript
// src/renderer/state/models.ts

interface CoreUIState {
  /** The current theme (light or dark) */
  theme: 'light' | 'dark';

  /** The current language code (e.g., 'en', 'es') */
  language: string;

  /** The current search query in the header */
  searchQuery: string;
}
```

## 2. Movie Card Model

This model represents the data required to display a single movie card in any view (Discovery, Library). It's a subset of the larger `MediaItem` type used in the backend.

```typescript
// src/renderer/components/MovieCard.tsx

interface MovieCardProps {
  /** Unique identifier for the movie */
  id: string;

  /** URL for the movie's poster image */
  posterUrl: string;

  /** Title of the movie */
  title: string;

  /** Year of release */
  year: number;

  /** User's rating, if available (e.g., 8.1) */
  rating?: number;

  /** Current download status */
  status: 'downloaded' | 'downloading' | 'not-downloaded';
}
```

## 3. View-Specific Models

These models represent the props required for each primary view.

### Home View (Discovery)

```typescript
// src/renderer/views/HomeView.tsx

interface HomeViewProps {
  /** List of movies to display in the main grid */
  movies: MovieCardProps[];

  /** List of featured movies for the hero section */
  featured: MovieCardProps[];

  /** Callback function when a search is initiated */
  onSearch: (query: string) => void;
}
```

### Downloads View

```typescript
// src/renderer/views/DownloadsView.tsx

interface DownloadItem extends MovieCardProps {
  /** Download progress from 0 to 1 */
  progress: number;
  /** Download speed in a human-readable format (e.g., "1.2 MB/s") */
  speed: string;
}

interface DownloadsViewProps {
  /** List of active and completed downloads */
  downloads: DownloadItem[];
}
```

### Library View

```typescript
// src/renderer/views/LibraryView.tsx

interface LibraryViewProps {
  /** List of all movies in the user's library */
  libraryItems: MovieCardProps[];

  /** Callback function when a search is initiated */
  onSearch: (query: string) => void;
}
```

### Settings View

The settings view will directly interact with the backend API for settings and does not require a specific data model for its props, as it will fetch and manage its own state.

## 4. Navigation Model

This model defines the structure for navigation links in the sidebar.

```typescript
// src/renderer/components/Sidebar.tsx

interface NavLink {
  /** The path for the link (e.g., '/') */
  to: string;

  /** The translation key for the link's text */
  labelKey: string;

  /** SVG path or component for the icon */
  icon: React.ReactNode;
}
```

This data model provides a clear structure for the UI components and their interactions, ensuring consistency and type safety throughout the new renderer implementation.

