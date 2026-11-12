@echo off
title WasteCHAiN Android APK Builder
cls
echo ========================================================
echo       WasteCHAiN - Android APK Builder (Expo EAS)
echo ========================================================
echo.
cd /d "%~dp0mobile"

echo [1/2] Checking Expo account status...
echo.
call npx --yes eas-cli whoami 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------
    echo Expo me login nahi ho. Pehle apna Expo account login karo:
    echo (Agar account nahi hai toh https://expo.dev par free banta hai)
    echo ----------------------------------------------------
    echo.
    call npx --yes eas-cli login
)

echo.
echo [2/2] Starting Cloud APK Build (Profile: preview - standalone .apk)...
echo.
call npx --yes eas-cli build -p android --profile preview

echo.
echo ========================================================
echo Build complete ya link generate ho gaya hai!
echo Upar diye link ya QR code se phone me download kar lo.
echo ========================================================
pause
