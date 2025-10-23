@echo off
REM Chilly Movies - Windows Packaging Script (CMD)
REM This batch file helps package the application for Windows

echo =====================================
echo   Chilly Movies - Windows Packager
echo =====================================
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: v%NPM_VERSION%
echo.

:menu
echo Select packaging option:
echo   1. Install dependencies and build
echo   2. Package for Windows (both installer + portable)
echo   3. Package installer only (NSIS)
echo   4. Package portable only
echo   5. Full workflow (install + build + package)
echo   6. Clean and rebuild everything
echo   7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto install_build
if "%choice%"=="2" goto package_all
if "%choice%"=="3" goto package_nsis
if "%choice%"=="4" goto package_portable
if "%choice%"=="5" goto full_workflow
if "%choice%"=="6" goto clean_rebuild
if "%choice%"=="7" goto end
echo Invalid choice!
goto menu

:install_build
echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully!
echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build completed successfully!
goto success

:package_all
echo.
echo Packaging for Windows (installer + portable)...
call npm run package:win
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b 1
)
echo [OK] Packaging completed successfully!
echo.
echo Output files are in: ./release/
start "" explorer.exe "release"
goto success

:package_nsis
echo.
echo Packaging Windows installer (NSIS)...
call npm run package:win:nsis
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b 1
)
echo [OK] Installer created successfully!
echo.
echo Output files are in: ./release/
start "" explorer.exe "release"
goto success

:package_portable
echo.
echo Packaging portable app...
call npm run package:win:portable
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b 1
)
echo [OK] Portable app created successfully!
echo.
echo Output files are in: ./release/
start "" explorer.exe "release"
goto success

:full_workflow
echo.
echo Starting full workflow...
echo.
echo Step 1/3: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed at dependency installation!
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.
echo Step 2/3: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed at build step!
    pause
    exit /b 1
)
echo [OK] Build completed
echo.
echo Step 3/3: Packaging for Windows...
call npm run package:win
if %errorlevel% neq 0 (
    echo [ERROR] Failed at packaging step!
    pause
    exit /b 1
)
echo [OK] Packaging completed
echo.
echo =====================================
echo   [OK] ALL STEPS COMPLETED SUCCESSFULLY
echo =====================================
echo.
echo Output files are in: ./release/
start "" explorer.exe "release"
goto success

:clean_rebuild
echo.
echo WARNING: This will delete dist/, release/, and node_modules/
set /p confirm="Are you sure? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Clean cancelled.
    goto end
)

echo.
echo Cleaning directories...
if exist "dist" (
    rmdir /s /q "dist"
    echo [OK] Removed dist/
)
if exist "release" (
    rmdir /s /q "release"
    echo [OK] Removed release/
)
if exist "node_modules" (
    echo Removing node_modules/ (this may take a moment)...
    rmdir /s /q "node_modules"
    echo [OK] Removed node_modules/
)

echo.
echo Reinstalling dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)

echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo Packaging for Windows...
call npm run package:win
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b 1
)

echo.
echo [OK] Clean rebuild completed successfully!
echo.
echo Output files are in: ./release/
start "" explorer.exe "release"
goto success

:success
echo.
echo Done!
echo.
pause
exit /b 0

:end
echo Exiting...
exit /b 0
