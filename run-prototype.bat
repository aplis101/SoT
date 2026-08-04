@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Hadith Platform - Prototype
cd /d "%~dp0app"

set "LOG=%~dp0_run.log"
echo === run-prototype %DATE% %TIME% === > "%LOG%"

echo ============================================================
echo   Hadith Platform - Prototype
echo ============================================================
echo.
echo Folder: %CD%
echo Folder: %CD% >> "%LOG%"
echo.

rem ---------- check node ----------
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH.
  echo [ERROR] node not found >> "%LOG%"
  echo Install Node.js LTS from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODEV=%%v"
echo Node: !NODEV!
echo Node: !NODEV! >> "%LOG%"

rem ---------- install deps ----------
if not exist "node_modules\next\package.json" (
  echo.
  echo [1/3] Installing dependencies ^(1-2 minutes, only the first time^)...
  call npm install --no-audit --no-fund >> "%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERROR] npm install failed. Details in _run.log
    echo [ERROR] npm install failed >> "%LOG%"
    echo.
    pause
    exit /b 1
  )
  echo       done.
) else (
  echo [1/3] Dependencies already present - skipping.
)

rem ---------- env file ----------
if not exist ".env.local" copy ".env.local.example" ".env.local" >nul
echo [2/3] .env.local ready ^(placeholder keys^).

rem ---------- find brave ----------
set "BRAVE="
if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" set "BRAVE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined BRAVE if exist "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" set "BRAVE=%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe"
if not defined BRAVE if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" set "BRAVE=%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"

if defined BRAVE (
  echo [3/3] Brave found. It will open in ~15 seconds.
  echo Brave: !BRAVE! >> "%LOG%"
  start "" /b cmd /c timeout /t 15 /nobreak ^>nul ^& "!BRAVE!" --new-window http://localhost:3000
) else (
  echo [3/3] Brave not found - will use your default browser instead.
  echo Brave: NOT FOUND >> "%LOG%"
  start "" /b cmd /c timeout /t 15 /nobreak ^>nul ^& start http://localhost:3000
)

echo.
echo   Server starting on http://localhost:3000
echo   Keep THIS window open. Ctrl+C to stop.
echo.

call npm run dev
echo.
echo [server stopped]
pause
