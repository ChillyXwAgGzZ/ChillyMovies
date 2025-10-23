; NSIS Installer Script for Chilly Movies
; This script customizes the Windows installer behavior

!macro customHeader
  ; Add custom header text
  !insertmacro MUI_HEADER_TEXT "Chilly Movies Setup" "Desktop-first offline movie downloader and player"
!macroend

!macro customInstall
  ; Add custom installation steps
  DetailPrint "Installing Chilly Movies..."
  DetailPrint "Setting up application files..."
!macroend

!macro customUnInstall
  ; Clean up custom files on uninstall
  DetailPrint "Removing Chilly Movies..."
  
  ; Remove user data only if requested
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to remove all application data including downloads and library? $\nClick No to keep your data." /SD IDNO IDNO skip_data_removal
    RMDir /r "$APPDATA\chilly-movies"
    RMDir /r "$LOCALAPPDATA\chilly-movies"
    skip_data_removal:
  ${endIf}
!macroend

!macro customInit
  ; Custom initialization
  SetShellVarContext current
!macroend

; Custom welcome page text
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Chilly Movies Setup"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Chilly Movies.$\r$\n$\r$\nChilly Movies is a desktop application for downloading and managing your movie collection offline.$\r$\n$\r$\nClick Next to continue."
!macroend
