# Icon Assets for Chilly Movies

This directory should contain application icons for various platforms.

## Required Icons

### Windows (`icon.ico`)
- Format: ICO file
- Recommended sizes: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 (multi-resolution)
- Should include multiple sizes in one file for best Windows compatibility
- Used for: Application icon, taskbar, file associations, installer

### Linux (`icon.png`)
- Format: PNG file
- Recommended size: 512x512 or 1024x1024
- Transparent background recommended
- Used for: Application icon in Linux desktops

### macOS (`icon.icns`)
- Format: ICNS file
- Recommended size: 512x512@2x (1024x1024)
- Used for: Application icon in macOS

## How to Create Icons

### Option 1: Online Conversion Tools
1. Create a high-resolution PNG (at least 1024x1024)
2. Convert to different formats:
   - **ICO**: https://icoconvert.com/ or https://cloudconvert.com/png-to-ico
   - **ICNS**: https://cloudconvert.com/png-to-icns

### Option 2: Using Electron Icon Maker
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon-source.png --output=./assets
```

### Option 3: Using ImageMagick (Windows/Linux/Mac)
```bash
# Install ImageMagick first (https://imagemagick.org/)

# Create ICO with multiple sizes
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Create PNG at specific size
magick convert icon.png -resize 512x512 icon.png

# For macOS ICNS, use additional tools like png2icns
```

### Option 4: Manual Creation
- Use design software (Photoshop, GIMP, Illustrator, Figma, etc.)
- Export to required formats
- Ensure transparent backgrounds where appropriate

## Design Guidelines

### Icon Design Best Practices
1. **Simple and recognizable** - clear at small sizes
2. **High contrast** - visible in both light and dark themes
3. **No text** - or minimal text that's readable at 16x16
4. **Distinctive** - unique enough to identify your app
5. **Consistent** - matches your app's branding

### Recommended Design
For Chilly Movies, consider:
- Movie/film reel icon
- Snowflake + play button (matches "Chilly" theme)
- Popcorn icon
- TV/monitor icon
- Download icon with film elements

### Color Scheme
- Primary: Blues/cyan (matches "Chilly")
- Accent: Orange/warm tones (contrast)
- Style: Modern, flat design or subtle gradients

## Temporary/Default Icons

If you don't have custom icons yet, electron-builder will:
1. Use Electron's default icon (not recommended for production)
2. Show warnings during build
3. App will still work but won't look professional

## Current Status

📝 **ACTION REQUIRED**: Add icon files to this directory before packaging for production.

Files needed:
- [ ] `icon.ico` (Windows)
- [ ] `icon.png` (Linux)
- [ ] `icon.icns` (macOS)

## Quick Icon Creation Service

If you need professional icons quickly:
- **Fiverr**: Search for "app icon design"
- **99designs**: Icon design contests
- **Flaticon/Icons8**: Download and customize existing icons (check licenses)
- **Canva**: Create simple icons yourself

## Testing Icons

After adding icons:
1. Rebuild the package: `npm run package:win`
2. Check the installer icon
3. Check the installed app icon
4. Check taskbar/system tray icon
5. Verify all sizes look good

## Notes

- Icons should be square (1:1 aspect ratio)
- Use transparent backgrounds for better integration
- Test on both light and dark backgrounds
- Windows supports ICO files with embedded multiple sizes (better than single-size)
- High DPI displays need high-resolution icons (512x512 or larger source)

---

For now, the app is configured to use icons from this directory. The build will work without them but will show warnings.
