@echo off
rem Puts the original aria2c.exe back. Run it from anywhere; it finds Badzy's tools folder.
setlocal
set "T=%~1"
if defined T goto have_t
if exist "%~dp0aria2c-real.exe" set "T=%~dp0"
if defined T goto have_t
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p=(Get-Process Badzy -ErrorAction SilentlyContinue | Select-Object -First 1).Path; if($p){Split-Path $p -Parent}"`) do if exist "%%P\tools\aria2c-real.exe" set "T=%%P\tools"
if defined T goto have_t
for %%D in ("C:\Badzy\tools" "%LOCALAPPDATA%\Programs\Badzy\tools" "%ProgramFiles%\Badzy\tools" "D:\Badzy\tools") do if exist "%%~D\aria2c-real.exe" set "T=%%~D"
:have_t
if defined T if "%T:~-1%"=="\" set "T=%T:~0,-1%"
if not defined T goto nothing
if not exist "%T%\aria2c-real.exe" goto nothing
taskkill /f /im Badzy.exe >nul 2>&1
taskkill /f /im aria2c.exe >nul 2>&1
taskkill /f /im aria2c-real.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del /f /q "%T%\aria2c.exe"
ren "%T%\aria2c-real.exe" aria2c.exe
echo Original aria2c.exe restored in %T%
pause
exit /b 0
:nothing
echo Nothing to undo: no aria2c-real.exe found. If Badzy's tools folder is elsewhere:
echo   undo-torrent-fix.bat "C:\path\to\Badzy\tools"
pause
exit /b 1
