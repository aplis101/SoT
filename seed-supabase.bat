@echo off
title Seed Supabase with all hadith collections
cd /d "%~dp0app"
set "LOG=%~dp0_seed.log"

echo ============================================================
echo   Seed Supabase - all 10 collections (~36,000 hadiths)
echo   Source: fawazahmed0/hadith-api (Unlicense, public domain)
echo ============================================================
echo.
echo   Requires app\.env.local with:
echo     NEXT_PUBLIC_SUPABASE_URL
echo     SUPABASE_SERVICE_ROLE_KEY
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  pause
  exit /b 1
)

node scripts/seed-supabase.mjs %* 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%LOG%'"
echo.
echo [done] log: _seed.log
pause
