@echo off
setlocal
cd /d "%~dp0"
title SRTMood

set "PSEXE=powershell"
where powershell >nul 2>nul || set "PSEXE=pwsh"

"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch.ps1" %*
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
  echo [!] SRTMood failed to start. Exit code: %EXITCODE%
) else (
  echo [i] SRTMood is running in the background.
)
echo Press any key to close this window...
pause >nul

endlocal
