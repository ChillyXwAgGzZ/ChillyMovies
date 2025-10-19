# Feature Spec: UI/UX Bug Fixes and Polish

## Overview
This feature addresses critical UI bugs and polish issues to make ChillyMovies production-ready. Focus is on fixing broken functionality, improving visual consistency, and ensuring all interactive elements work properly.

## User Stories

### US-1: Movie Download UI Polish
**As a** user selecting movie download quality  
**I want** a clean, intuitive UI for choosing quality and viewing torrent options  
**So that** I can easily understand my download choices

**Acceptance Criteria:**
- Quality selector buttons are properly styled and responsive
- Torrent list shows clear seeders/leechers information
- Loading states are visually clear
- No layout shifts or visual bugs
- Works on all screen sizes

### US-2: TV Episode Downloads Visibility
**As a** user downloading TV episodes  
**I want** to see my episode downloads in the Downloads section  
**So that** I can track their progress

**Acceptance Criteria:**
- Episode downloads appear in downloads list with proper naming (e.g., "Breaking Bad S01E01")
- Episode progress bars work correctly
- Episode metadata (season, episode number) is visible
- Multiple episode downloads are distinguishable

### US-3: Theme Switching
**As a** user who prefers dark/light mode  
**I want** the theme toggle to actually switch themes  
**So that** I can use the app in my preferred visual mode

**Acceptance Criteria:**
- Theme toggle button switches between light and dark modes
- Theme preference persists across sessions
- All UI components respect the selected theme
- Smooth transition between themes

### US-4: Search in Detail Pages
**As a** user viewing movie/TV details  
**I want** to use the search bar to find other content  
**So that** I don't have to navigate back to search again

**Acceptance Criteria:**
- Search bar works from movie detail pages
- Search bar works from TV detail pages
- Search results navigate properly
- Search state is preserved when returning

### US-5: Library Management
**As a** user managing my library  
**I want** to play and delete downloaded content  
**So that** I can manage my media collection

**Acceptance Criteria:**
- Play button opens a video player (stub for now, full implementation post-packaging)
- Delete button removes media from library and updates UI
- Confirmation dialog before deletion
- UI updates immediately after deletion

### US-6: Download Location Settings
**As a** user configuring download settings  
**I want** to choose where my downloads are saved  
**So that** I can organize my media files

**Acceptance Criteria:**
- Browse button opens file picker (Electron native dialog)
- Selected path is saved and persisted
- Path validation (must be writable)
- Clear indication of current download location

### US-7: Clean Placeholder Data
**As a** user navigating the app  
**I want** to see realistic or neutral placeholders  
**So that** the app feels professional and complete

**Acceptance Criteria:**
- No "test job", "test SE1" text visible
- Loading states show skeleton UI or spinners
- Empty states have helpful messages
- All text is properly localized

## Technical Requirements

### TR-1: Component Architecture
- All components must follow React best practices
- Proper TypeScript typing for all props and state
- Error boundaries for graceful error handling
- Consistent styling using Tailwind CSS

### TR-2: State Management
- Download state must be properly managed and synced
- Library state must update on deletions
- Settings state must persist to disk
- Theme state must persist to localStorage

### TR-3: Electron Integration
- File picker must use Electron's native dialog API
- Video player stub must use proper IPC communication
- File operations must be secure and sandboxed

### TR-4: Accessibility
- All interactive elements must be keyboard accessible
- Proper ARIA labels for screen readers
- Focus management in modals
- Color contrast meets WCAG AA

### TR-5: Localization
- All new UI text must have English and Swahili translations
- Translation keys must follow existing i18n structure
- No hardcoded strings in components

## Constitution Alignment

### Principle I: Desktop-First, Local-First ✅
- All fixes maintain local-first operation
- No cloud dependencies introduced
- File operations use local filesystem

### Principle II: Explicit Legal & Ethical Compliance ✅
- No changes affecting legal/ethical stance
- Delete functionality respects user ownership

### Principle III: Modular, Extensible Architecture ✅
- Component fixes maintain modularity
- Video player stub uses clear interface for future implementation
- Settings changes use existing config system

### Principle VI: User-First, Accessible, Bilingual UI ✅
- All fixes improve accessibility
- Bilingual support maintained and enhanced
- UI polish improves user experience

### Principle VII: AI Assistance Is Assistive, Not Autonomous ✅
- No AI features affected by these changes
- User control maintained in all operations

## Out of Scope
- Actual video player implementation (requires packaging)
- Real file download testing (requires packaged environment)
- Advanced subtitle features
- Network streaming capabilities

## Success Metrics
- All 7 user stories pass acceptance criteria
- No console errors in normal operation
- Smooth 60fps animations
- <100ms UI response time for interactions
- 100% i18n coverage for new strings

## Dependencies
- Existing Electron setup
- Existing React + TypeScript frontend
- Existing i18n system
- Existing API backend

## Risk Assessment
- **Low Risk**: UI polish and bug fixes don't affect core functionality
- **Medium Risk**: File picker implementation may vary by OS
- **Mitigation**: Test on multiple platforms, provide fallbacks
