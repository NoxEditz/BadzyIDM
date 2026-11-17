@echo off
rem Badzy torrent fix: puts a helper in front of aria2c.exe (see aria2c-wrapper.c).
rem Keep this file and aria2c-fix.exe together (any folder, even Badzy's tools
rem folder) and double-click this file. It finds Badzy's tools folder by itself.
rem Another place:  install-torrent-fix.bat "D:\path\to\tools"
setlocal
set "T=%~1"
if defined T goto have_t
if exist "%~dp0yt-dlp.exe" set "T=%~dp0"
if defined T goto have_t
if exist "%~dp0ffmpeg.exe" set "T=%~dp0"
if defined T goto have_t
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p=(Get-Process Badzy -ErrorAction SilentlyContinue | Select-Object -First 1).Path; if($p){Split-Path $p -Parent}"`) do if exist "%%P\tools" set "T=%%P\tools"
if defined T goto have_t
for %%D in ("C:\Badzy\tools" "%LOCALAPPDATA%\Programs\Badzy\tools" "%ProgramFiles%\Badzy\tools" "D:\Badzy\tools") do if exist "%%~D\yt-dlp.exe" set "T=%%~D"
if defined T goto have_t
echo Badzy tools folder not found.
echo Start Badzy and run this again, or give the folder:
echo   install-torrent-fix.bat "C:\path\to\Badzy\tools"
pause
exit /b 1

:have_t
if "%T:~-1%"=="\" set "T=%T:~0,-1%"
if not exist "%T%" (
  echo Folder does not exist: %T%
  pause
  exit /b 1
)
echo Badzy tools folder: %T%

rem the fix: aria2c-fix.exe, or ^(old download^) a small aria2c.exe next to this file
set "FIX=%~dp0aria2c-fix.exe"
if exist "%FIX%" goto have_fix
set "FIX=%~dp0aria2c.exe"
if not exist "%FIX%" goto no_fix
for %%F in ("%FIX%") do if %%~zF GEQ 1000000 goto no_fix
:have_fix
copy /y "%FIX%" "%TEMP%\badzy-aria2c-fix.exe" >nul
if errorlevel 1 goto no_fix
goto stop_apps
:no_fix
echo aria2c-fix.exe must be next to this file.
pause
exit /b 1

:stop_apps
taskkill /f /im Badzy.exe >nul 2>&1
taskkill /f /im aria2c.exe >nul 2>&1
taskkill /f /im aria2c-real.exe >nul 2>&1
timeout /t 2 /nobreak >nul

rem ---- the real aria2 (the big one, about 6 MB) must sit next to it as aria2c-real.exe
set "SZ=0"
if exist "%T%\aria2c-real.exe" for %%F in ("%T%\aria2c-real.exe") do set "SZ=%%~zF"
if %SZ% GEQ 1000000 goto real_ok
set "SZ=0"
if exist "%T%\aria2c.exe" for %%F in ("%T%\aria2c.exe") do set "SZ=%%~zF"
if %SZ% LSS 1000000 goto find_real
move /y "%T%\aria2c.exe" "%T%\aria2c-real.exe" >nul
goto real_ok

:find_real
echo Looking for the real aria2 that Badzy downloaded...
call :scan "%APPDATA%\Badzy"
call :scan "%LOCALAPPDATA%\Badzy"
if exist "%T%\aria2c-real.exe" goto real_ok
echo Not found on this PC, downloading aria2 1.37.0 from its official GitHub page...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $d=Join-Path $env:TEMP 'badzy-aria2'; Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue; New-Item -ItemType Directory $d | Out-Null; $z=Join-Path $d 'a.zip'; Invoke-WebRequest -UseBasicParsing 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip' -OutFile $z; if ((Get-FileHash $z -Algorithm SHA256).Hash -ne '67d015301eef0b612191212d564c5bb0a14b5b9c4796b76454276a4d28d9b288') { throw 'the download does not match its known checksum' }; Expand-Archive $z $d; $e=Get-ChildItem $d -Recurse -Filter aria2c.exe | Select-Object -First 1; if ((Get-FileHash $e.FullName -Algorithm SHA256).Hash -ne 'be2099c214f63a3cb4954b09a0becd6e2e34660b886d4c898d260febfe9d70c2') { throw 'aria2c.exe does not match its known checksum' }; Copy-Item $e.FullName (Join-Path '%T%' 'aria2c-real.exe') -Force"
if not exist "%T%\aria2c-real.exe" (
  echo Could not get the real aria2. Check the internet and run this again.
  pause
  exit /b 1
)

:real_ok
copy /y "%TEMP%\badzy-aria2c-fix.exe" "%T%\aria2c.exe" >nul
if errorlevel 1 (
  echo Could not copy the fix into %T%
  pause
  exit /b 1
)
echo.
echo Done. Start Badzy and add the torrent again.
echo If it still does not download, send me %T%\aria2-fix.log
pause
exit /b 0

:scan
if not exist "%~1" exit /b 0
for /f "delims=" %%F in ('dir /s /b "%~1\aria2c.exe" 2^>nul') do call :take "%%F"
exit /b 0

:take
if exist "%T%\aria2c-real.exe" exit /b 0
for %%Z in ("%~1") do if %%~zZ GEQ 1000000 copy /y "%~1" "%T%\aria2c-real.exe" >nul
exit /b 0
