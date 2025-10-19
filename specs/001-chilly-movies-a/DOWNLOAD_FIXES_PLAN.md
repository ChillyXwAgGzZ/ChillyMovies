# Download System Fixes & Improvements Plan

**Date:** October 19, 2025  
**Status:** In Progress  
**Priority:** P0 CRITICAL

## 🐛 Critical Issues Identified

### 1. ERR_PACKAGE_PATH_NOT_EXPORTED (BLOCKING)
**Impact:** Downloads completely broken  
**Root Cause:** `create-torrent@6.1.0` (WebTorrent dependency) has ESM export issues with tsx/Node.js  
**Error:** `No "exports" main defined in /workspaces/ChilluMovies/node_modules/create-torrent/package.json`

**Solutions (in order of preference):**
- **A.** Downgrade `webtorrent` to v1.x which uses CommonJS (fastest)
- **B.** Use Aria2 downloader instead of WebTorrent (better long-term)
- **C.** Add module resolution fixes in tsconfig/package.json
- **D.** Fork and fix create-torrent package

**Time Estimate:** 1-2 hours  
**Chosen Solution:** A + B (downgrade for quick fix, then migrate to Aria2)

---

### 2. UI Torrent Selection Issue
**Impact:** Users can't choose specific torrents  
**Current Behavior:** Shows multiple torrents but only has single "Start" button  
**Expected Behavior:** Let users select which specific torrent to download

**Solution:**
- Add radio buttons or click-to-select for each torrent card
- Highlight selected torrent visually
- Auto-select best torrent by default (already done)
- Show clear "Selected" indicator

**Time Estimate:** 1 hour

---

### 3. UI/UX Polish Needed
**Issues:**
- No loading animations during torrent search
- Error messages not styled properly
- No transition animations
- Download progress not visible after starting
- Success state unclear

**Improvements:**
- Smooth modal animations (fade in/out)
- Skeleton loading for torrent cards
- Better error styling with retry button
- Download started → auto-redirect with progress indicator
- Add download progress badge to Downloads nav item

**Time Estimate:** 2-3 hours

---

### 4. TV Series Download Not Implemented
**Current State:** Uses same download panel as movies (doesn't support episodes)  
**Required Features:**
- Season/Episode selector
- Batch download (entire season or multiple episodes)
- Episode-specific torrent search
- Progress tracking per episode
- Queue management

**Time Estimate:** 6-8 hours

---

## 📋 Implementation Plan

### Phase 1: Critical Fixes (P0) - 3 hours
**Goal:** Get downloads working end-to-end

#### TASK-005: Fix WebTorrent Module Error
- [ ] Downgrade webtorrent to v1.9.x (last stable CommonJS version)
- [ ] Test download with downgraded version
- [ ] If still failing, switch to Aria2 downloader
- [ ] Update package.json and lockfile
- **Time:** 1-2 hours

#### TASK-006: Fix Torrent Selection UI
- [ ] Add visual selection state to torrent cards
- [ ] Make torrent cards clickable to select
- [ ] Add "Selected" badge/checkmark
- [ ] Ensure only one torrent can be selected at a time
- [ ] Update DownloadPanel.tsx component
- **Time:** 1 hour

#### TASK-007: Test Complete Download Flow
- [ ] Search for movie (e.g., "Inception")
- [ ] Open Download panel
- [ ] Select quality (1080p)
- [ ] See torrents list
- [ ] Select specific torrent
- [ ] Click Start Download
- [ ] Verify navigation to Downloads page
- [ ] Confirm SSE progress tracking works
- [ ] Verify file downloads to media folder
- [ ] Check library entry created
- **Time:** 30 minutes

---

### Phase 2: UI/UX Improvements (P1) - 3 hours

#### TASK-008: Download Panel Animations
- [ ] Add fade-in animation for modal
- [ ] Add slide-up animation for torrent cards
- [ ] Add loading skeleton for torrent search
- [ ] Add smooth quality button transitions
- [ ] Add success checkmark animation
- **Time:** 1 hour

#### TASK-009: Better Error Handling
- [ ] Style error messages with icons
- [ ] Add "Retry" button for failed searches
- [ ] Show specific error for "No torrents found"
- [ ] Add "Try different quality" suggestion
- [ ] Add provider status indicators
- **Time:** 1 hour

#### TASK-010: Download Progress Indicators
- [ ] Add badge to Downloads nav item (shows active count)
- [ ] Show mini progress bar in success message
- [ ] Add toast notification for download started
- [ ] Add toast notification for download completed
- **Time:** 1 hour

---

### Phase 3: TV Series Support (P1) - 8 hours

#### TASK-011: TV Series Torrent Search
- [ ] Update torrent search to support season/episode format
- [ ] Add episode-specific query formatting
- [ ] Filter results by season/episode number
- [ ] Handle multi-episode packs
- **Time:** 2 hours

#### TASK-012: Season/Episode Selector Component
- [ ] Create SeasonEpisodeSelector component
- [ ] Grid layout for episodes
- [ ] Multi-select with checkboxes
- [ ] "Select All" / "Select Season" buttons
- [ ] Episode metadata display (title, air date, duration)
- **Time:** 3 hours

#### TASK-013: Batch Download Queue
- [ ] Queue management system
- [ ] Sequential download (one at a time)
- [ ] Parallel download option (configurable)
- [ ] Progress tracking per episode
- [ ] Overall batch progress indicator
- **Time:** 2 hours

#### TASK-014: TV Detail Page Integration
- [ ] Update TVDetailView with episode selector
- [ ] Replace simple download button with episode picker
- [ ] Show download status per episode
- [ ] Add "Resume watching" for partially downloaded seasons
- **Time:** 1 hour

---

## 🎯 Success Criteria

### Phase 1 (Must Have)
- ✅ Downloads work without errors
- ✅ Users can select specific torrents
- ✅ Download progress tracked in Downloads page
- ✅ Files saved to media folder
- ✅ Library entries created correctly

### Phase 2 (Should Have)
- ✅ Smooth animations and transitions
- ✅ Clear error messages with recovery options
- ✅ Visual feedback for all states (loading, success, error)
- ✅ Download notifications visible in nav

### Phase 3 (Nice to Have)
- ✅ TV episodes downloadable individually
- ✅ Batch download works for full seasons
- ✅ Episode metadata displayed
- ✅ Queue management functional

---

## 📊 Total Time Estimate
- **Phase 1 (Critical):** 3 hours
- **Phase 2 (Polish):** 3 hours  
- **Phase 3 (TV Series):** 8 hours
- **Total:** 14 hours

---

## 🚀 Next Steps
1. Start with TASK-005 (Fix WebTorrent error) - BLOCKING
2. Complete TASK-006 (Selection UI) - HIGH PRIORITY
3. Test end-to-end (TASK-007)
4. Move to Phase 2 for polish
5. Implement TV series support in Phase 3
