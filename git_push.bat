@echo off
title Git Push WasteCHAiN
echo ========================================================
echo   Adding fixes, committing and pushing to Git...
echo ========================================================

git add web/package.json web/next.config.ts .gitignore
git commit -m "fix(vercel): resolve drizzle-orm and neon packages for backend imports during build"
git push

echo.
echo ========================================================
echo   Pushed successfully! Vercel redeploying now...
echo ========================================================
