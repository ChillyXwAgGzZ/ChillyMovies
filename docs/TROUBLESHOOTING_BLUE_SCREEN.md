# Troubleshooting Guide - Blue Screen Issue

## ✅ Issue Fixed: Blue Screen in Browser

### **Problem**
When running `npm run dev`, the app briefly shows the UI then turns completely blue after about 1 second.

### **Root Cause**
The React app was crashing because `window.electronAPI` is only available when running inside Electron, not in a regular browser (like the Codespaces Simple Browser or Vite dev server preview).

When the DiscoveryView and DownloadsView components tried to access `window.electronAPI.getBackendPort()`, it threw an error because the object didn't exist, causing React to crash and show the error overlay (which appears as a blue screen).

### **Solutions Applied**

#### 1. Added Browser Compatibility Checks
**Files Modified:**
- `src/renderer/views/DiscoveryView.tsx`
- `src/renderer/views/DownloadsView.tsx`

**Changes:**
- Added checks for `window.electronAPI` existence before trying to access it
- Fallback to port 3000 when running in browser (without Electron)
- Direct fetch API calls as fallback for download actions

```typescript
// Before (crashed in browser)
window.electronAPI.getBackendPort().then(port => {
  setBackendPort(port);
});

// After (works in both browser and Electron)
if (!window.electronAPI) {
  console.warn("Not running in Electron, using default backend port");
  setBackendPort(3000);
  return;
}

window.electronAPI.getBackendPort().then(port => {
  setBackendPort(port);
});
```

#### 2. Updated TypeScript Declarations
**File:** `src/renderer/vite-env.d.ts` (NEW)

Made `window.electronAPI` optional with the `?` operator so TypeScript knows it might not exist:

```typescript
interface Window {
  electronAPI?: {  // Notice the ? making it optional
    getBackendPort: () => Promise<number>;
    // ... other methods
  };
}
```

#### 3. Enhanced CSS Styling
**File:** `src/renderer/App.css`

Added styles for:
- Error banner (red background for error messages)
- Result card posters (movie poster images)
- Media type badges (Movie/TV Show indicators)
- Rating display
- Progress details

### **Testing the Fix**

#### Option 1: Run in Browser (Vite Dev Server)
```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend only
npm run dev:renderer

# Open http://localhost:5173 in browser
```

**Expected Behavior:**
- ✅ No blue screen
- ✅ UI loads correctly with search bar
- ✅ Console warning: "Not running in Electron, using default backend port"
- ✅ Search functionality works (connects to backend on port 3000)

#### Option 2: Run in Electron (Full App)
```bash
npm run dev
```

**Expected Behavior:**
- ✅ Electron window opens
- ✅ No console warnings
- ✅ Full IPC functionality available
- ✅ DevTools show no errors

### **Why This Happened**

The issue occurs because there are **two ways to run the app**:

1. **In Electron** (`npm run dev` or `npm run dev:electron`)
   - Full desktop app with IPC bridge
   - `window.electronAPI` is injected by the preload script
   - All features work

2. **In Browser** (`npm run dev:renderer` only)
   - Web-only mode for faster development
   - No `window.electronAPI` available
   - Need fallback logic for backend communication

The original code assumed Electron was always present, which caused crashes in browser-only mode.

### **How to Prevent This in Future**

When accessing Electron APIs, always check if they exist:

```typescript
// ❌ BAD - Will crash in browser
const data = await window.electronAPI.someMethod();

// ✅ GOOD - Works everywhere
if (window.electronAPI) {
  const data = await window.electronAPI.someMethod();
} else {
  // Fallback for browser mode
  const response = await fetch('/api/endpoint');
  const data = await response.json();
}
```

### **Development Workflow**

For fastest iteration during UI development:

```bash
# Terminal 1: Backend (keep running)
npm run dev:backend

# Terminal 2: Frontend only (restart this one frequently)
npm run dev:renderer
```

This way you can see changes instantly in the browser without restarting Electron.

For testing full Electron features (IPC, native menus, etc.):

```bash
# All three processes at once
npm run dev
```

### **Related Files**

- ✅ `src/renderer/views/DiscoveryView.tsx` - Added browser compatibility
- ✅ `src/renderer/views/DownloadsView.tsx` - Added browser compatibility  
- ✅ `src/renderer/vite-env.d.ts` - Made electronAPI optional
- ✅ `src/renderer/App.css` - Enhanced UI styles
- ✅ `src/renderer/index.html` - CSP already fixed in previous commit

### **Verification**

Run these commands to verify the fix:

```bash
# 1. Start backend
npm run dev:backend &

# 2. Wait 2 seconds for backend to start
sleep 2

# 3. Test backend is responding
curl http://localhost:3000/metadata/search?q=test

# 4. Start frontend in new terminal
npm run dev:renderer

# 5. Open http://localhost:5173 - should show UI without blue screen
```

### **Summary**

✅ **Fixed**: Blue screen crash by adding `window.electronAPI` existence checks  
✅ **Fixed**: TypeScript errors by making electronAPI optional  
✅ **Enhanced**: UI styles for better movie display  
✅ **Tested**: Works in both browser and Electron modes  
✅ **Committed**: All changes pushed to `001-chilly-movies-a` branch

The app now gracefully handles being run in either Electron or a regular browser, with appropriate fallbacks for each environment.

---

**Last Updated:** 2025-10-16  
**Commit:** `3e120bc`  
**Status:** ✅ Resolved
