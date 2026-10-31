@echo off
title Git Push WasteCHAiN
echo ========================================================
echo   Adding changes, committing and pushing to Git...
echo ========================================================

git add -A
git commit -m "feat: upgrade mobile to Expo SDK 58, premium typography, Fast2SMS auth, live camera reporting"
git push

echo.
echo ========================================================
echo   Git push process finished!
echo ========================================================
