# Phase 4: UX Refinements & Homepage Enhancement

**Branch**: `004-004-theme-fetch`  
**Date**: October 23, 2025  
**Status**: In Progress  
**Priority**: P1 - HIGH

---

## Overview

This phase focuses on critical UX fixes and new homepage features to enhance the user experience and visual appeal of ChillyMovies.

---

## 🐞 Critical Bug Fixes

### TASK-4.1: Fix Infinite Scroll Reset Bug (P0 - CRITICAL)

**Priority**: P0 - CRITICAL  
**Estimated Time**: 1 hour  
**Status**: 🔴 Not Started

**Problem Description**:
- When scrolling on Movies/TV Series pages, loading more content causes page to reset to top
- Happens both during normal scrolling and after applying filters
- Loading animation shows, but scroll position is lost

**Root Cause Analysis**:
- `useEffect` for scroll restoration runs after EVERY `movies.length` change
- This includes when new movies are appended via infinite scroll
- The restoration logic conflicts with natural scroll position

**Solution**:
1. Remove the scroll restoration `useEffect` that listens to `movies.length`
2. Only restore scroll position on initial mount (one-time operation)
3. Add a flag to prevent restoration during infinite scroll appends
4. Use `useLayoutEffect` instead of `useEffect` for synchronous DOM updates

**Files to Modify**:
- `src/renderer/views/MoviesView.tsx` (lines 80-95)
- `src/renderer/views/TVSeriesView.tsx` (lines 80-95)

**Implementation Steps**:
```typescript
// 1. Add flag to track if this is initial mount
const [isInitialMount, setIsInitialMount] = useState(true);

// 2. Remove problematic useEffect
// DELETE: useEffect that restores scroll on movies.length change

// 3. Add proper restoration on mount only
useLayoutEffect(() => {
  if (isInitialMount && !loading && movies.length > 0) {
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition && mainContainerRef.current) {
      mainContainerRef.current.scrollTop = parseInt(savedPosition, 10);
      setIsInitialMount(false);
    }
  }
}, [isInitialMount, loading, movies.length]);
```

**Acceptance Criteria**:
- [x] Infinite scroll loads new content without resetting to top
- [x] Scroll position maintained during pagination
- [x] Scroll position restored when returning from detail page
- [x] Filters apply without scroll jump
- [x] Works on both Movies and TV Series pages

---

### TASK-4.2: Fix Scroll Position Persistence (P0 - CRITICAL)

**Priority**: P0 - CRITICAL  
**Estimated Time**: 30 minutes  
**Status**: 🔴 Not Started  
**Depends On**: TASK-4.1

**Problem Description**:
- Browsing to movie #800, clicking it, then going back resets to top
- "Awareness" of scroll position lost across navigation
- Issue likely connected to scroll reset bug

**Solution**:
1. Ensure scroll position saves BEFORE navigation
2. Verify sessionStorage persists correctly
3. Test restoration after TASK-4.1 fixes

**Files to Verify**:
- `src/renderer/views/MoviesView.tsx` (handleCardClick)
- `src/renderer/views/TVSeriesView.tsx` (handleCardClick)

**Acceptance Criteria**:
- [x] Click movie #800 → detail page → back → returns to exact position
- [x] Scroll position persists across all detail page navigations
- [x] Works for both Movies and TV Series pages

---

## 🎨 New Features

### TASK-4.3: Homepage Hero Banner/Carousel (P1 - HIGH)

**Priority**: P1 - HIGH  
**Estimated Time**: 4-6 hours  
**Status**: 🔴 Not Started

**Feature Description**:
Implement a Netflix-style hero banner on the homepage with auto-sliding featured movies.

**Design Requirements**:

**Hero Banner Specifications**:
- Display 6 latest popular movies in a carousel
- Full-width banner with large movie backdrop image
- Auto-slide every 5 seconds (configurable)
- Manual navigation: Left/Right arrow buttons
- Navigation dots/indicators at bottom
- Smooth transitions between slides
- Updates daily with latest popular movies

**Banner Content Per Slide**:
- Large backdrop image (full width, 60vh height)
- Movie title (large, bold typography)
- Movie overview/tagline (2-3 lines max)
- Release year and rating badge
- "Watch Now" or "More Info" button
- Gradient overlay for text readability

**Homepage Layout**:
```
┌─────────────────────────────────────────────┐
│          Hero Banner (Carousel)             │
│     [Backdrop + Movie Info + Controls]      │
│              6 Movies Rotation              │
└─────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│         Popular Movies Section              │
│     [Smaller Cards - Horizontal Scroll]     │
└─────────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│       Popular TV Series Section             │
│     [Smaller Cards - Horizontal Scroll]     │
└─────────────────────────────────────────────┘
```

**Technical Implementation**:

1. **Create HeroBanner Component** (`src/renderer/components/HeroBanner.tsx`):
```typescript
interface HeroBannerProps {
  movies: MediaMetadata[];
  autoSlideInterval?: number; // Default: 5000ms
}

Features:
- useEffect for auto-slide timer
- useState for current slide index
- Keyboard navigation (left/right arrows)
- Touch swipe support (optional)
- Pause auto-slide on hover
- Preload next slide image
```

2. **Create Carousel Controls Component**:
```typescript
- Left/Right arrow buttons (styled, hover effects)
- Navigation dots (active state indication)
- Progress bar (optional, shows time until next slide)
```

3. **Update DiscoveryView.tsx**:
```typescript
- Fetch 6 popular movies for banner
- Pass to HeroBanner component
- Reduce card size for Popular Movies/TV sections
- Adjust grid layout for visual balance
```

4. **Styling Requirements**:
- Backdrop image with gradient overlay (linear-gradient bottom-to-top)
- Responsive design: Mobile, Tablet, Desktop breakpoints
- Smooth CSS transitions (opacity, transform)
- Modern glassmorphism effects for buttons
- Accessibility: ARIA labels, keyboard navigation
- Dark/Light theme support

**API Integration**:
- Fetch from `/metadata/popular?mediaType=movie&page=1`
- Take first 6 movies for banner
- Cache for 24 hours (daily refresh)
- Fallback to stored movies if API fails

**Files to Create**:
- `src/renderer/components/HeroBanner.tsx` (main component)
- `src/renderer/components/HeroBanner.css` (optional, if not using Tailwind)
- `src/renderer/components/CarouselControls.tsx` (arrows + dots)

**Files to Modify**:
- `src/renderer/views/DiscoveryView.tsx` (integrate banner)
- `src/renderer/components/MovieCard.tsx` (optional: add size prop for homepage)

**Acceptance Criteria**:
- [x] Banner displays 6 latest popular movies
- [x] Auto-slides every 5 seconds
- [x] Left/Right arrows work for manual navigation
- [x] Navigation dots indicate current slide
- [x] Smooth transitions between slides
- [x] Pause on hover, resume on mouse leave
- [x] Responsive design works on all screen sizes
- [x] Keyboard navigation (arrow keys)
- [x] "More Info" button navigates to movie detail page
- [x] Banner updates daily with new popular movies
- [x] Graceful fallback if API fails
- [x] Accessible (ARIA labels, keyboard navigation)
- [x] Theme-aware (dark/light mode support)

**Design References**:
- Netflix homepage hero section
- Disney+ banner carousel
- HBO Max featured content

---

### TASK-4.4: Fix Light Mode Text Visibility (P1 - HIGH)

**Priority**: P1 - HIGH  
**Estimated Time**: 1 hour  
**Status**: 🔴 Not Started

**Problem Description**:
In Light Mode, movie/TV detail pages have text visibility issues:
- Status, Season, First Air Date, Last Air Date labels are faded/invisible
- Networks and Production Companies text is invisible
- Text color remains white in light mode, blending with background

**Root Cause**:
- CSS classes not using theme-aware text colors
- Missing `dark:text-gray-300` utility classes
- Background cards need theme-specific styling

**Solution**:

1. **Update MovieDetailView.tsx** (lines 200-400):
```typescript
// BEFORE (light mode invisible):
<p className="text-gray-400">Status</p>

// AFTER (theme-aware):
<p className="text-gray-600 dark:text-gray-400">Status</p>
```

2. **Update TVSeriesDetailView.tsx** (lines 200-400):
- Same fixes as MovieDetailView
- Ensure all labels use theme-aware colors

3. **Theme-Aware Color Mapping**:
```css
/* Labels/Secondary Text */
Light Mode: text-gray-600 (darker, visible)
Dark Mode: text-gray-400 (lighter, visible)

/* Primary Text */
Light Mode: text-gray-900
Dark Mode: text-white

/* Background Cards */
Light Mode: bg-gray-100 border-gray-200
Dark Mode: bg-gray-800 border-gray-700

/* Info Cards (Status, Seasons, etc.) */
Light Mode: bg-white border-gray-200
Dark Mode: bg-gray-800/50 border-gray-700
```

**Files to Modify**:
- `src/renderer/views/MovieDetailView.tsx` (Info card sections)
- `src/renderer/views/TVSeriesDetailView.tsx` (Info card sections)

**Sections to Fix**:
1. Status card
2. Seasons card
3. First Air Date card
4. Last Air Date card
5. Language card
6. Networks section
7. Production Companies section

**Implementation Pattern**:
```tsx
{/* BEFORE */}
<div className="bg-gray-800/50 rounded-lg p-6">
  <div className="flex items-center gap-3 mb-4">
    <Calendar className="w-5 h-5 text-gray-400" />
    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
      Status
    </h3>
  </div>
  <p className="text-white text-lg">{show.status}</p>
</div>

{/* AFTER */}
<div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
  <div className="flex items-center gap-3 mb-4">
    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
      Status
    </h3>
  </div>
  <p className="text-gray-900 dark:text-white text-lg">{show.status}</p>
</div>
```

**Acceptance Criteria**:
- [x] All labels visible in Light Mode
- [x] All labels visible in Dark Mode
- [x] Status card has proper contrast
- [x] Seasons/Episodes card readable
- [x] First/Last Air Date visible
- [x] Networks logos/text visible
- [x] Production Companies text visible
- [x] Smooth theme transitions
- [x] No text color flashing during theme switch

**Testing Checklist**:
- [ ] Test MovieDetailView in Light Mode
- [ ] Test MovieDetailView in Dark Mode
- [ ] Test TVSeriesDetailView in Light Mode
- [ ] Test TVSeriesDetailView in Dark Mode
- [ ] Toggle theme while on detail page (smooth transition)
- [ ] Verify all info cards are readable in both themes

---

## 🎨 Visual Design Guidelines

### Homepage Hero Banner Design

**Color Scheme**:
- Backdrop overlay: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))`
- Title text: White with text-shadow for readability
- Buttons: Primary indigo-600, hover indigo-700
- Navigation dots: White with opacity (active: 100%, inactive: 50%)

**Typography**:
- Movie Title: `text-4xl md:text-5xl lg:text-6xl font-bold`
- Overview: `text-base md:text-lg text-gray-200 line-clamp-3`
- Year/Rating: `text-sm text-gray-300`

**Spacing**:
- Banner height: `h-[60vh] min-h-[400px] max-h-[700px]`
- Content padding: `p-8 md:p-12 lg:p-16`
- Sections gap: `gap-12` between banner and popular sections

**Animation**:
- Slide transition: `transition-opacity duration-700 ease-in-out`
- Button hover: `transition-all duration-300`
- Dot animation: `transition-all duration-300`

---

## 📋 Implementation Order

1. **TASK-4.1** (P0): Fix infinite scroll reset bug → **DO THIS FIRST**
2. **TASK-4.2** (P0): Verify scroll persistence works → **TEST AFTER 4.1**
3. **TASK-4.4** (P1): Fix light mode visibility → **Quick win, do next**
4. **TASK-4.3** (P1): Implement hero banner → **Feature work, do last**

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Infinite Scroll**:
- [ ] Movies page: Scroll to bottom, load page 2, verify no jump to top
- [ ] Movies page: Apply genre filter, verify no scroll reset
- [ ] TV Series page: Same tests as Movies
- [ ] Verify loading animation shows correctly

**Scroll Persistence**:
- [ ] Browse to movie #50, click, go back → returns to position
- [ ] Browse to movie #800 (deep scroll), click, go back → returns to position
- [ ] Test on TV Series page as well
- [ ] Test with filters applied

**Light Mode Visibility**:
- [ ] Open movie detail in light mode → all text visible
- [ ] Open TV series detail in light mode → all info cards visible
- [ ] Toggle theme on detail page → smooth transition
- [ ] Check Networks section in both themes
- [ ] Check Production Companies in both themes

**Hero Banner**:
- [ ] Homepage loads with 6 featured movies
- [ ] Auto-slide works (every 5 seconds)
- [ ] Left arrow navigates to previous slide
- [ ] Right arrow navigates to next slide
- [ ] Dots indicate current slide
- [ ] Hover pauses auto-slide
- [ ] "More Info" button navigates to detail page
- [ ] Responsive on mobile, tablet, desktop
- [ ] Keyboard arrow keys work
- [ ] Works in both dark and light themes

---

## 📊 Success Metrics

- **Bug Fixes**: 0 scroll reset issues reported
- **User Experience**: Smooth infinite scroll, maintained scroll position
- **Visual Appeal**: Modern homepage with engaging hero banner
- **Accessibility**: All features keyboard-navigable, ARIA compliant
- **Theme Support**: Perfect visibility in both dark and light modes

---

## 📚 References

- Firebase Studio infinite scroll implementation: `docs/ENHANCEMENT_SUGGESTIONS.MD`
- Netflix hero banner design patterns
- Current scroll logic: `src/renderer/views/MoviesView.tsx` (lines 70-95)
- Theme system: Tailwind dark mode classes

---

**Last Updated**: January 14, 2025  
**Phase**: 4 - UX Refinements & Homepage Enhancement  
**Status**: Ready to Start
