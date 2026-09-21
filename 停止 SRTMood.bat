@echo off
setlocal
cd /d "%~dp0"
title SRTMood - stop

set "PSEXE=powershell"
where powershell >nul 2>nul || set "PSEXE=pwsh"

"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"

echo Press any key to close this window...
pause >nul

endlocal
