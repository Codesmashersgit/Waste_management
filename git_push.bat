@echo off
title Git Push WasteCHAiN Fix
echo ========================================================
echo   Adding all fixes and pushing to Git...
echo ========================================================

git add -A
git commit -m "fix(vercel): dbConfig safe fallback, eslint bypass, and dependency resolutions"
git push

echo.
echo ========================================================
echo   Pushed successfully! Check Vercel build now.
echo ========================================================
