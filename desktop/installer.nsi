!include "MUI2.nsh"
Name "TraWe"
OutFile "release\TraWeSetup.exe"
Unicode True
InstallDir "$LOCALAPPDATA\TraWe"
InstallDirRegKey HKCU "Software\TraWe" "InstallDir"
RequestExecutionLevel user
!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\TraWe.exe"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "release\TraWe-win32-x64\*.*"
  CreateShortCut "$SMPROGRAMS\TraWe.lnk" "$INSTDIR\TraWe.exe" "" "$INSTDIR\TraWe.exe" 0
  CreateShortCut "$DESKTOP\TraWe.lnk" "$INSTDIR\TraWe.exe" "" "$INSTDIR\TraWe.exe" 0
  WriteRegStr HKCU "Software\TraWe" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe" "DisplayName" "TraWe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe" "DisplayIcon" "$INSTDIR\TraWe.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe" "Publisher" "TraWe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\TraWe.lnk"
  Delete "$DESKTOP\TraWe.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\TraWe"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\TraWe"
SectionEnd
