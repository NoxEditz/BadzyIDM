@echo off
rem Puts the original aria2c.exe back.
setlocal
set "T=%~1"
if "%T%"=="" set "T=%LOCALAPPDATA%\Programs\Badzy\tools"
if not exist "%T%\aria2c-real.exe" (
  echo Nothing to undo in %T%
  pause
  exit /b 1
)
taskkill /f /im Badzy.exe >nul 2>&1
taskkill /f /im aria2c.exe >nul 2>&1
taskkill /f /im aria2c-real.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del /f /q "%T%\aria2c.exe"
ren "%T%\aria2c-real.exe" aria2c.exe
echo Original aria2c.exe restored.
pause
