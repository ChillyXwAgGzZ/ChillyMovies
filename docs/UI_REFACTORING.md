# UI Refactoring for Design System Integration

## Overview

This refactoring prepares the Chilly Movies frontend for integration with a modern design system (e.g., Google Stitch, Tailwind CSS, or custom CSS-in-JS solution).

## What Was Changed

### 1. Created Reusable Component Library

**Location**: `src/renderer/components/`

#### New Components:

- **Button.tsx** - Reusable button with variants (primary, secondary, danger, ghost) and sizes
- **MovieCard.tsx** - Card component for displaying movie/TV show metadata
- **TorrentCard.tsx** - Card component for displaying torrent results
- **ProgressBar.tsx** - Configurable progress indicator with variants
- **Modal.tsx** - Flexible modal/dialog component with sizes
- **DownloadCard.tsx** - Card component for active downloads with progress
- **SearchBar.tsx** - Unified search input component
- **EmptyState.tsx** - Placeholder component for empty content areas
- **index.ts** - Barrel export file for easy importing

### 2. Refactored Views

#### DiscoveryView.tsx
**Before**: Inline JSX with hardcoded HTML elements
**After**: Uses `MovieCard`, `TorrentCard`, `SearchBar`, and `EmptyState` components

**Benefits**:
- Cleaner, more maintainable code
- Consistent UI patterns across search results
- Easy to swap or restyle components

#### DownloadsView.tsx
**Before**: Inline download cards with complex progress rendering
**After**: Uses `DownloadCard` and `EmptyState` components

**Benefits**:
- Simplified view logic
- Progress rendering encapsulated in component
- Easier to add new download features

### 3. Updated Styles

**File**: `src/renderer/App.css`

Added component-specific styles that are:
- **Modular**: Each component has its own style section
- **BEM-like**: Uses consistent naming conventions
- **Design-system-ready**: Easy to replace with utility classes or CSS-in-JS

## Component API Design

All components follow these principles:

### 1. Props-based Configuration
```typescript
<Button variant="primary" size="md" fullWidth />
```

### 2. Callback Handlers
```typescript
<MovieCard 
  onWatchTrailer={() => handleTrailer()} 
  onFindTorrents={() => handleTorrents()} 
/>
```

### 3. Optional Styling
```typescript
<Modal size="lg" className="custom-modal" />
```

### 4. Accessibility
- ARIA labels
- Semantic HTML
- Keyboard navigation support

## Migration Path to Design System

### Option 1: Tailwind CSS Integration

1. Install Tailwind:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. Update component classNames:
   ```tsx
   // Before
   <button className="btn-primary">Click</button>
   
   // After  
   <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
     Click
   </button>
   ```

3. Remove custom CSS, keep utility classes

### Option 2: CSS-in-JS (Styled Components / Emotion)

1. Install library:
   ```bash
   npm install styled-components
   npm install -D @types/styled-components
   ```

2. Convert components:
   ```tsx
   import styled from 'styled-components';
   
   const StyledButton = styled.button`
     background-color: ${props => props.theme.colors.primary};
     padding: 0.75rem 1.5rem;
     border-radius: 0.375rem;
   `;
   ```

3. Add theme provider in App.tsx

### Option 3: Google Stitch Integration

1. Follow Stitch setup documentation
2. Map existing components to Stitch primitives
3. Use Stitch design tokens for colors, spacing, typography
4. Leverage Stitch's component library where applicable

## Current Architecture

```
src/renderer/
├── components/          # ✅ NEW: Reusable UI components
│   ├── Button.tsx
│   ├── MovieCard.tsx
│   ├── TorrentCard.tsx
│   ├── ProgressBar.tsx
│   ├── Modal.tsx
│   ├── DownloadCard.tsx
│   ├── SearchBar.tsx
│   ├── EmptyState.tsx
│   └── index.ts
├── views/               # ✅ REFACTORED: Simplified view logic
│   ├── DiscoveryView.tsx
│   ├── DownloadsView.tsx
│   ├── LibraryView.tsx
│   └── SettingsView.tsx
├── App.tsx
├── App.css             # ✅ UPDATED: Component styles added
└── index.css
```

## Design System Readiness Checklist

- [x] Extract reusable UI components
- [x] Consistent prop interfaces
- [x] Separated presentation from logic
- [x] Modular CSS structure
- [x] Accessibility features
- [x] TypeScript type safety
- [ ] Theme system (colors, spacing, typography tokens)
- [ ] Responsive breakpoints
- [ ] Dark/light mode support
- [ ] Component documentation (Storybook)
- [ ] Unit tests for components

## Next Steps

### Phase 1: Design Tokens
- Define color palette
- Define spacing scale
- Define typography system
- Define shadow/elevation system

### Phase 2: Theme Implementation
- Create theme provider
- Convert CSS variables to theme tokens
- Implement dark/light mode

### Phase 3: Component Enhancement
- Add loading states
- Add error states
- Add skeleton loaders
- Add animations/transitions

### Phase 4: Testing & Documentation
- Write component tests
- Create Storybook stories
- Document component APIs
- Create design system documentation

## Breaking Changes

**None** - All functionality is preserved. This is a structural refactoring only.

## Testing

Run existing tests to verify functionality:
```bash
npm test
```

Build the project to verify TypeScript compilation:
```bash
npm run build
```

Start the app to verify UI:
```bash
npm run dev
```

## Notes for Design System Team

1. **Component Props**: All components accept `className` prop for custom styling
2. **Variants**: Button, ProgressBar have variant props ready for theme mapping
3. **Sizes**: Components support size props (sm, md, lg) for consistent scaling
4. **Icons**: Currently using emoji placeholders - replace with proper icon system
5. **Spacing**: Inline styles still used in some places - migrate to design tokens

## Questions?

See `/docs/CURRENT_STATUS.md` for architecture overview.
