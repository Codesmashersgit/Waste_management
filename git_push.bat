@echo off
echo ===== WasteCHAiN Deploy Script =====

echo Step 1: Copying drone image to web/public...
copy /Y "C:\Users\sudha\.gemini\antigravity\brain\986140a5-d670-4b84-930c-6166b982c8e9\futuristic_smart_city_night_1793643946958.jpg" "%~dp0web\public\drone-smart-city-night.jpg"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Image copy failed. Check if source file exists.
) else (
    echo Image copied successfully!
)

echo Step 2: Git add all...
cd /d "%~dp0"
git add -A

echo Step 3: Git commit...
git commit -m "feat(map): live GPS auto-tracking on dashboard - snap back after manual move, blue dot marker, auto reverse geocode"

echo Step 4: Git push...
git push origin main

echo ===== Done! Check Vercel dashboard for build status. =====
pause
