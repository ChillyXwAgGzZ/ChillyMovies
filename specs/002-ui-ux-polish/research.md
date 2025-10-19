# Research: UI/UX Bug Fixes Implementation

## Decision: Theme Switching Implementation
**Chosen:** React Context + localStorage persistence  
**Rationale:** 
- Lightweight solution without external dependencies
- Integrates well with existing React app
- localStorage provides simple persistence
- Can be enhanced later with more sophisticated theme systems

**Alternatives Considered:**
- styled-components theming: Too heavy for current needs
- CSS variables only: Less dynamic, harder to manage in React
- Tailwind dark mode classes: Chosen! Already in use, just needs activation

**Implementation:**
```typescript
// Use Tailwind's dark mode with class strategy
// Add dark class to html element
// Store preference in localStorage
```

## Decision: File Picker Integration
**Chosen:** Electron's dialog.showOpenDialog  
**Rationale:**
- Native OS file picker experience
- Secure sandboxed file access
- Cross-platform support built-in
- Electron IPC already established

**Alternatives Considered:**
- Web File System API: Not suitable for desktop app
- Custom file browser: Unnecessary complexity
- Third-party library: Electron native is sufficient

**Implementation:**
```typescript
// Main process: electron.dialog.showOpenDialog
// Renderer: IPC call to main process
// Returns selected path for settings storage
```

## Decision: Video Player Stub
**Chosen:** HTML5 video element with custom controls  
**Rationale:**
- Simple for stub implementation
- Can be enhanced with react-player later
- Built-in browser support
- Accessible and well-documented

**Alternatives Considered:**
- video.js: Overkill for initial stub
- plyr: Nice but adds dependency
- Custom canvas player: Too complex for stub

**Implementation:**
```tsx
// Stub that shows file path and basic controls
// IPC communication to get file URL
// Full implementation after packaging
```

## Decision: Library Delete Functionality
**Chosen:** Backend API call + optimistic UI update  
**Rationale:**
- Maintains separation of concerns
- Backend handles file system operations securely
- Optimistic update for smooth UX
- Can rollback on error

**Alternatives Considered:**
- Direct file deletion from renderer: Security risk
- Soft delete only: User expects actual deletion
- Batch delete: Can add later as enhancement

**Implementation:**
```typescript
// POST /library/delete with media ID
// Backend removes file and updates storage
// Frontend optimistically updates state
// Show toast on success/failure
```

## Decision: Download Panel UI Improvements
**Chosen:** Redesign with card-based layout  
**Rationale:**
- Cards clearly separate quality options
- Better visual hierarchy with badges
- Hover states improve interactivity
- Responsive grid layout

**Best Practices:**
- Loading skeleton during torrent search
- Clear seeders/leechers indicators with colors
- Disabled state for unavailable qualities
- Toast notifications for feedback

## Decision: Episode Download Display
**Chosen:** Enhanced download item component with episode metadata  
**Rationale:**
- Reuse existing DownloadJob interface
- Add episode-specific rendering
- Show season/episode in title
- Use episode thumbnail if available

**Implementation:**
```typescript
// Check if download has seasonNumber/episodeNumber metadata
// Render specialized episode download card
// Format title: "Show Name S##E## - Episode Name"
// Show episode thumbnail from TMDB
```

## Decision: Search Bar in Detail Pages
**Chosen:** Lift search state to App.tsx with React Router  
**Rationale:**
- Search should work from any page
- Router navigation handles URL updates
- State preserved in URL params
- No prop drilling needed

**Implementation:**
```typescript
// Search component reads/writes URL params
// Router navigate() on search submission
// Detail pages include search in header
// Search results page uses URL params
```

## Technical Stack Decisions

### UI Framework
- **React 18+**: Already in use, hooks for state management
- **TypeScript**: Strict typing for reliability
- **Tailwind CSS**: Utility-first styling, dark mode built-in
- **lucide-react**: Icon library already in use

### State Management
- **useState/useContext**: For local component state and theme
- **React Query** (future): For server state management
- **localStorage**: For persistent settings (theme, download path)

### Electron APIs Needed
- `dialog.showOpenDialog`: File picker
- `shell.openPath`: Open downloaded files
- `fs`: File operations (via IPC)
- `path`: Path manipulation

### Testing Strategy
- Unit tests for utility functions
- Component tests with React Testing Library
- E2E tests for critical flows (post-packaging)
- Manual testing on Windows/Mac/Linux

## UI/UX Patterns

### Loading States
- Skeleton screens for content loading
- Spinner for quick operations (<1s)
- Progress bars for downloads
- Disabled buttons during async operations

### Error Handling
- Toast notifications for user-facing errors
- Error boundaries for component crashes
- Retry mechanisms with exponential backoff
- Clear error messages with actions

### Empty States
- Helpful illustrations or icons
- Clear call-to-action
- Contextual help text
- Example content or onboarding

### Confirmation Dialogs
- Modal for destructive actions (delete)
- Clear action buttons (Cancel/Confirm)
- Explanation of consequences
- Keyboard shortcuts (Esc/Enter)

## Performance Considerations
- Lazy load video player component
- Debounce search input (300ms)
- Virtual scrolling for large episode lists
- Optimize re-renders with React.memo
- Image lazy loading with Intersection Observer

## Accessibility Patterns
- Semantic HTML (button, nav, main, etc.)
- ARIA labels for icon buttons
- Focus management in modals
- Keyboard navigation (Tab, Arrow keys)
- Screen reader announcements for dynamic content

## Localization Strategy
- Add i18n keys to existing en/sw translations
- Use t() function in all components
- No hardcoded strings
- Context-aware translations (plurals, dates)

## Risk Mitigation
- File picker fallback: Show manual input field if dialog fails
- Video stub failure: Show file path and "open externally" button
- Delete failure: Rollback optimistic update, show error
- Theme persistence failure: Default to system preference
