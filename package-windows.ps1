# Chilly Movies - Windows Packaging Script
# This script helps package the application for Windows distribution

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Chilly Movies - Windows Packager  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check if Node version is 18 or higher
    $versionNumber = $nodeVersion -replace 'v', '' -replace '\..*$', ''
    if ([int]$versionNumber -lt 18) {
        Write-Host "✗ Node.js version must be 18 or higher!" -ForegroundColor Red
        Write-Host "  Please download from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Select packaging option:" -ForegroundColor Cyan
Write-Host "  1. Install dependencies and build" -ForegroundColor White
Write-Host "  2. Package for Windows (both installer + portable)" -ForegroundColor White
Write-Host "  3. Package installer only (NSIS)" -ForegroundColor White
Write-Host "  4. Package portable only" -ForegroundColor White
Write-Host "  5. Full workflow (install + build + package)" -ForegroundColor White
Write-Host "  6. Clean and rebuild everything" -ForegroundColor White
Write-Host "  7. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Building application..." -ForegroundColor Yellow
            npm run build
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Build completed successfully!" -ForegroundColor Green
            } else {
                Write-Host "✗ Build failed!" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "✗ Dependency installation failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Packaging for Windows (installer + portable)..." -ForegroundColor Yellow
        npm run package:win
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Packaging completed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Output files are in: ./release/" -ForegroundColor Cyan
            explorer.exe "release"
        } else {
            Write-Host "✗ Packaging failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Packaging Windows installer (NSIS)..." -ForegroundColor Yellow
        npm run package:win:nsis
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Installer created successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Output files are in: ./release/" -ForegroundColor Cyan
            explorer.exe "release"
        } else {
            Write-Host "✗ Packaging failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "Packaging portable app..." -ForegroundColor Yellow
        npm run package:win:portable
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Portable app created successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Output files are in: ./release/" -ForegroundColor Cyan
            explorer.exe "release"
        } else {
            Write-Host "✗ Packaging failed!" -ForegroundColor Red
            exit 1
        }
    }
    
    "5" {
        Write-Host ""
        Write-Host "Starting full workflow..." -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Step 1/3: Installing dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed at dependency installation!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Step 2/3: Building application..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed at build step!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Build completed" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Step 3/3: Packaging for Windows..." -ForegroundColor Yellow
        npm run package:win
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed at packaging step!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Packaging completed" -ForegroundColor Green
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host "  ✓ ALL STEPS COMPLETED SUCCESSFULLY" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Output files are in: ./release/" -ForegroundColor Cyan
        explorer.exe "release"
    }
    
    "6" {
        Write-Host ""
        Write-Host "WARNING: This will delete dist/, release/, and node_modules/" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        
        if ($confirm -eq "yes") {
            Write-Host ""
            Write-Host "Cleaning directories..." -ForegroundColor Yellow
            
            if (Test-Path "dist") {
                Remove-Item -Recurse -Force "dist"
                Write-Host "✓ Removed dist/" -ForegroundColor Green
            }
            
            if (Test-Path "release") {
                Remove-Item -Recurse -Force "release"
                Write-Host "✓ Removed release/" -ForegroundColor Green
            }
            
            if (Test-Path "node_modules") {
                Write-Host "Removing node_modules/ (this may take a moment)..." -ForegroundColor Yellow
                Remove-Item -Recurse -Force "node_modules"
                Write-Host "✓ Removed node_modules/" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "✗ Installation failed!" -ForegroundColor Red
                exit 1
            }
            
            Write-Host ""
            Write-Host "Building application..." -ForegroundColor Yellow
            npm run build
            if ($LASTEXITCODE -ne 0) {
                Write-Host "✗ Build failed!" -ForegroundColor Red
                exit 1
            }
            
            Write-Host ""
            Write-Host "Packaging for Windows..." -ForegroundColor Yellow
            npm run package:win
            if ($LASTEXITCODE -ne 0) {
                Write-Host "✗ Packaging failed!" -ForegroundColor Red
                exit 1
            }
            
            Write-Host ""
            Write-Host "✓ Clean rebuild completed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Output files are in: ./release/" -ForegroundColor Cyan
            explorer.exe "release"
        } else {
            Write-Host "Clean cancelled." -ForegroundColor Yellow
        }
    }
    
    "7" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
