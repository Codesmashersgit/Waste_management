@echo off
title Git Push WasteCHAiN Fix
echo ========================================================
echo   Adding Web3Auth noble/hashes fix and pushing...
echo ========================================================

git add web/package.json
git commit -m "fix(web3auth): pin @noble/hashes to 1.4.0 to resolve assertBytes build error"
git push

echo.
echo ========================================================
echo   Pushed successfully! Vercel is now building...
echo ========================================================
