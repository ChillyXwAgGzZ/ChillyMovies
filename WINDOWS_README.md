# 🎬 Chilly Movies - Windows Quick Start

A desktop-first offline movie downloader and player for Windows.

## 🚀 Quick Start for Windows Users

### Method 1: Using PowerShell Script (Easiest)
1. Open PowerShell in the project directory
2. Run: `.\package-windows.ps1`
3. Follow the interactive menu

### Method 2: Using Batch File
1. Open Command Prompt in the project directory
2. Run: `package-windows.bat`
3. Follow the interactive menu

### Method 3: Manual Commands
```powershell
# Install dependencies
npm install

# Build the application
npm run build

# Package for Windows
npm run package:win
```

## 📦 What Gets Created

After packaging, you'll find in the `release/` folder:

### 1. **Installer** (`Chilly Movies-Setup-0.1.0.exe`)
- Full installation wizard
- Desktop shortcut option
- Start menu integration
- Uninstaller included
- **Best for**: Regular users, permanent installation

### 2. **Portable** (`Chilly Movies-Portable-0.1.0.exe`)
- No installation needed
- Run directly from any location
- Perfect for USB drives
- Self-contained
- **Best for**: Testing, temporary use, portable setups

## ⚙️ Prerequisites

Before packaging, ensure you have:

### Required
- ✅ **Windows 10 or later**
- ✅ **Node.js 18+** - [Download here](https://nodejs.org/)
- ✅ **Git** - [Download here](https://git-scm.com/)

### For Building Native Modules
- ✅ **Python 3.x** - [Download here](https://www.python.org/)
- ✅ **Visual Studio Build Tools** or Visual Studio

#### Install Build Tools Quickly:
```powershell
# Option 1: Via npm (recommended)
npm install --global windows-build-tools

# Option 2: Manual installation
# Download Visual Studio Build Tools from:
# https://visualstudio.microsoft.com/downloads/
# Install "Desktop development with C++"
```

## 🎯 Packaging Commands

```powershell
# Package both installer and portable
npm run package:win

# Installer only (NSIS)
npm run package:win:nsis

# Portable only
npm run package:win:portable

# All platforms (Windows, Mac, Linux)
npm run package:all
```

## 🔧 Development Commands

```powershell
# Run in development mode
npm run dev

# Build without packaging
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
ChilluMovies/
├── src/                    # Source code
│   ├── main/              # Electron main process
│   ├── renderer/          # React UI
│   └── *.ts               # Backend services
├── assets/                # App icons and resources
├── release/               # Packaged applications (after build)
├── dist/                  # Compiled code (after build)
├── package.json           # Project configuration
└── WINDOWS_PACKAGING.md   # Detailed packaging guide
```

## 🎨 Adding Custom Icons

Before production packaging, add custom icons to `assets/`:

```
assets/
├── icon.ico      # Windows (256x256 multi-size)
├── icon.png      # Linux (512x512)
└── icon.icns     # macOS (1024x1024)
```

See `assets/README.md` for detailed icon creation guide.

## 🐛 Common Issues & Solutions

### Issue: "node-gyp" errors during install
```powershell
npm install --global windows-build-tools
npm install
```

### Issue: "better-sqlite3" build fails
```powershell
npm rebuild better-sqlite3 --build-from-source
```

### Issue: "Cannot find module" errors
```powershell
# Clean and reinstall
Remove-Item -Recurse -Force node_modules, dist, release
npm install
npm run build
```

### Issue: Antivirus blocks the app
- **Cause**: Unsigned applications trigger Windows SmartScreen
- **Solution**: 
  - Add exception to antivirus
  - Use portable version
  - Sign your app (requires code signing certificate)

### Issue: App doesn't start after packaging
1. Check that all dependencies were installed
2. Verify Node version is 18+
3. Try rebuilding: `npm run build`
4. Check logs in: `%APPDATA%/chilly-movies/logs/`

## 📝 Configuration

### TMDB API Key
Create a `.env` file in the project root:
```env
TMDB_API_KEY=your_api_key_here
```

Get your API key from: https://www.themoviedb.org/settings/api

### Download Location
Default: `~/Downloads/ChillyMovies/`

Can be changed in app settings after installation.

## 🚢 Distribution Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Add custom icons to `assets/`
- [ ] Configure TMDB API key
- [ ] Test on clean Windows machine
- [ ] Verify installer works
- [ ] Test portable version
- [ ] Check all features work
- [ ] Update CHANGELOG
- [ ] Create GitHub release

## 📖 Documentation

- **Detailed Packaging Guide**: `WINDOWS_PACKAGING.md`
- **Icon Creation Guide**: `assets/README.md`
- **General README**: `README.md`
- **Development Guide**: `DEVELOPMENT.md`

## 🔒 Code Signing (Optional)

For production releases, consider code signing to avoid SmartScreen warnings:

1. Purchase certificate from DigiCert, Sectigo, or similar
2. Configure in `package.json` or use environment variables:
   ```powershell
   $env:CSC_LINK = "C:\path\to\certificate.pfx"
   $env:CSC_KEY_PASSWORD = "your-password"
   npm run package:win
   ```

## 🎬 Features

- 🎥 Browse popular movies and TV series
- 🔍 Search with TMDB integration
- ⬇️ Download torrents
- 📚 Manage local library
- 🎨 Beautiful, modern UI
- 🌙 Dark mode support
- 🌍 Multi-language support
- 📱 Responsive design

## 💡 Tips

1. **First build takes longer** - Electron binaries need to be downloaded
2. **Use portable for testing** - Faster, no installation needed
3. **Keep release/ in .gitignore** - Don't commit packaged files
4. **Test before distributing** - Always test on a clean Windows VM
5. **Update regularly** - Keep dependencies up to date

## 🆘 Getting Help

- **Build Issues**: Check `WINDOWS_PACKAGING.md`
- **Icon Issues**: Check `assets/README.md`
- **App Issues**: Check main `README.md`
- **Electron Docs**: https://www.electronjs.org/
- **electron-builder Docs**: https://www.electron.build/

## 📞 Support

For issues:
1. Check documentation
2. Search existing GitHub issues
3. Create new issue with detailed description

---

## Quick Command Reference

```powershell
# Complete workflow
npm install              # Install dependencies
npm run build           # Build application
npm run package:win     # Create Windows packages

# Or use the scripts
.\package-windows.ps1   # PowerShell interactive menu
package-windows.bat     # CMD interactive menu

# Output location
.\release\              # Your packaged apps are here!
```

---

**Ready to package?** Just run `.\package-windows.ps1` and select option 5 for the full workflow! 🚀
