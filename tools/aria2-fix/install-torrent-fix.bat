@echo off
rem Badzy torrent fix: puts a helper in front of aria2c.exe (see aria2c-wrapper.c).
rem Put this file and aria2c.exe (the fix) in one folder and double-click it.
rem Another Badzy tools folder: install-torrent-fix.bat "D:\path\to\tools"
setlocal
set "T=%~1"
if "%T%"=="" set "T=%LOCALAPPDATA%\Programs\Badzy\tools"
if not exist "%T%\aria2c.exe" (
  echo Badzy tools folder not found: %T%
  echo Run again with the folder: install-torrent-fix.bat "C:\path\to\Badzy\tools"
  pause
  exit /b 1
)
if not exist "%~dp0aria2c.exe" (
  echo aria2c.exe ^(the fix^) must be next to this file.
  pause
  exit /b 1
)
taskkill /f /im Badzy.exe >nul 2>&1
taskkill /f /im aria2c.exe >nul 2>&1
taskkill /f /im aria2c-real.exe >nul 2>&1
timeout /t 2 /nobreak >nul
rem first time: the real aria2 keeps working under another name
if not exist "%T%\aria2c-real.exe" ren "%T%\aria2c.exe" aria2c-real.exe
copy /y "%~dp0aria2c.exe" "%T%\aria2c.exe" >nul
if errorlevel 1 (
  echo Could not copy the fix into %T%
  pause
  exit /b 1
)
echo Done. Start Badzy and add the torrent again.
echo If it still does not download, send me %T%\aria2-fix.log
pause
