# Windows Packaging Guide for Chilly Movies

This guide explains how to package Chilly Movies as a Windows application.

## Prerequisites

### 1. Windows Environment
- Windows 10 or later
- PowerShell or Command Prompt

### 2. Required Software
- **Node.js 18 or later**: Download from https://nodejs.org/
- **Git**: Download from https://git-scm.com/
- **Python 3.x** (required for building native modules like better-sqlite3)
- **Visual Studio Build Tools** (required for native modules)

### 3. Install Visual Studio Build Tools
For building native Node.js modules on Windows:

```powershell
# Option 1: Install via npm (recommended)
npm install --global windows-build-tools

# Option 2: Download Visual Studio Build Tools manually
# Visit: https://visualstudio.microsoft.com/downloads/
# Install "Desktop development with C++"
```

## Setup Instructions

### 1. Clone the Repository
```powershell
git clone https://github.com/salminhabibu/ChilluMovies.git
cd ChilluMovies
```

### 2. Install Dependencies
```powershell
npm install
```

This will install all required dependencies including:
- Electron
- electron-builder
- All application dependencies

### 3. Verify Build Configuration
The app is already configured for Windows packaging. Check `package.json` for:
- Windows-specific build settings
- NSIS installer configuration
- Portable app configuration

## Building the Application

### Development Build (Test the app first)
```powershell
# Run in development mode to test
npm run dev
```

### Production Build
```powershell
# Build all source files
npm run build
```

## Packaging for Windows

### Option 1: Create Both Installer and Portable (Recommended)
```powershell
npm run package:win
```

This creates:
- `Chilly Movies-Setup-0.1.0.exe` - NSIS installer
- `Chilly Movies-Portable-0.1.0.exe` - Portable version

### Option 2: Create Only Installer
```powershell
npm run package:win:nsis
```

### Option 3: Create Only Portable App
```powershell
npm run package:win:portable
```

## Output Location

All packaged files will be in:
```
ChilluMovies/release/
```

## Package Types Explained

### NSIS Installer (`*-Setup-*.exe`)
- **User-friendly installer** with wizard
- Allows user to choose installation directory
- Creates desktop and start menu shortcuts
- Supports uninstallation via Control Panel
- **Recommended for end users**

Features:
- Installation directory selection
- Create desktop shortcut option
- Automatic updates support (if configured)
- Clean uninstallation

### Portable App (`*-Portable-*.exe`)
- **No installation required** - run directly
- Perfect for USB drives or temporary use
- All data stored in app directory
- No registry entries
- Easy to move or delete

## Icon Requirements

The app expects icon files in `assets/` directory:
- `icon.ico` - Windows icon (256x256 or multi-size)
- `icon.png` - Linux icon (512x512 or 1024x1024)
- `icon.icns` - macOS icon (512x512@2x)

### Creating Icons

If you need to create icons from a PNG:

**Using online tools:**
- https://icoconvert.com/ (PNG to ICO)
- https://cloudconvert.com/png-to-ico

**Using command line (requires ImageMagick):**
```powershell
# Install ImageMagick first, then:
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Troubleshooting

### Issue: "node-gyp" errors during npm install
**Solution**: Install Python and Visual Studio Build Tools
```powershell
npm install --global windows-build-tools
```

### Issue: "better-sqlite3" build fails
**Solution**: Rebuild native modules
```powershell
npm rebuild better-sqlite3 --build-from-source
```

### Issue: "electron-builder" command not found
**Solution**: Install electron-builder globally
```powershell
npm install -g electron-builder
```

### Issue: Antivirus blocks the packaged app
**Solution**: This is common with unsigned apps. Options:
1. Add exception to antivirus
2. Sign the app (requires code signing certificate)
3. Use portable version instead

### Issue: "Missing icon" warnings
**Solution**: Add icon files to `assets/` directory:
- Create or download icons
- Place them in `assets/` folder
- Rebuild the package

## Code Signing (Optional but Recommended)

For production releases, sign your app to avoid Windows SmartScreen warnings:

1. **Purchase a code signing certificate** from:
   - DigiCert
   - Sectigo
   - GlobalSign

2. **Configure signing in package.json:**
```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "your-password",
  "signingHashAlgorithms": ["sha256"],
  "sign": "./sign.js"
}
```

3. **Or use environment variables:**
```powershell
$env:CSC_LINK = "C:\path\to\certificate.pfx"
$env:CSC_KEY_PASSWORD = "your-password"
npm run package:win
```

## Distribution Checklist

Before distributing your app:

- [ ] Test the packaged app on a clean Windows machine
- [ ] Verify all features work in production mode
- [ ] Check that downloads work correctly
- [ ] Ensure TMDB API key is configured
- [ ] Test installation and uninstallation
- [ ] Verify app icons appear correctly
- [ ] Test both installer and portable versions
- [ ] Check file associations (if any)
- [ ] Review license and terms
- [ ] Update version number in package.json

## Advanced Configuration

### Custom Install Path
Edit `package.json` → `build.nsis.perMachine` to `true` for system-wide installation.

### Auto-Update
Configure update server in `package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "salminhabibu",
  "repo": "ChilluMovies"
}
```

### 32-bit vs 64-bit
Current config builds both. To change:
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]  // Remove "ia32" for 64-bit only
    }
  ]
}
```

## Performance Tips

1. **First build may take 5-10 minutes** (downloads Electron binaries)
2. **Subsequent builds are faster** (cached)
3. **Portable app is smaller** than installer
4. **Clean build**: `npm run clean && npm run build`

## Support

For issues specific to:
- **Electron**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **Node.js native modules**: https://github.com/nodejs/node-gyp

## Quick Reference Commands

```powershell
# Install dependencies
npm install

# Development mode
npm run dev

# Build source
npm run build

# Package for Windows (both formats)
npm run package:win

# Package installer only
npm run package:win:nsis

# Package portable only
npm run package:win:portable

# Test E2E
npm run test:e2e

# Clean and rebuild
rm -r dist, release, node_modules
npm install
npm run package:win
```

## Next Steps

After packaging:
1. Test the installer on a clean Windows VM
2. Test the portable version
3. Verify all features work
4. Prepare release notes
5. Upload to GitHub releases or your distribution platform

---

**Package Ready!** ✅

The app is fully configured for Windows packaging. Just run `npm run package:win` on Windows PowerShell to create your distributable files.
