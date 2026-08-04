@echo off
chcp 65001 >nul
title Hadith Platform - Prototype
cd /d "%~dp0app"

echo ============================================================
echo   Hadith Platform - Prototype
echo   منصة الحديث الشريف - البروتوتايب
echo ============================================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js / npm not found in PATH.
  echo Install Node.js LTS from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/3] Installing dependencies... this takes 1-2 minutes, only once.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] npm install failed. See messages above.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dependencies already installed - skipping.
)

if not exist ".env.local" (
  copy ".env.local.example" ".env.local" >nul
  echo [2/3] Created .env.local from the example ^(placeholder keys^).
) else (
  echo [2/3] .env.local already exists - keeping yours.
)

echo [3/3] Starting dev server on http://localhost:3000
echo.
echo      Opening Brave in 12 seconds...
echo      Keep THIS window open. Press Ctrl+C here to stop the server.
echo.

start "" /b cmd /c "timeout /t 12 /nobreak >nul && start brave http://localhost:3000 || start http://localhost:3000"

call npm run dev
pause
