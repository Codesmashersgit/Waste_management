# WasteCHAiN Mobile

Expo SDK 57 / React Native app for Android and iOS. The app uses Expo Router with routes under `app/`.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the running `Waste_Management_App` service URL. A physical phone must be able to reach this address over the network.
3. Set `GEMINI_API_KEY` in the sibling Next.js backend's server-side `.env` file. Never put the Gemini key in this mobile app or an `EXPO_PUBLIC_*` variable.
4. Start Expo with `npx expo start --dev-client` and open it in the WasteCHAiN development build.

Mobile sign-in uses SMS OTP through the sibling Next.js backend. The backend needs Twilio Verify credentials and the phone-auth database migration before SMS login can complete. The mobile app stores access and rotating refresh tokens with Expo SecureStore. The OSM tracking map uses `react-native-webview`, so use a development build/APK instead of Expo Go after native dependency changes.

The welcome screen and Hindi/English onboarding stay available before sign-in. The web account uses Web3Auth; the mobile app uses phone OTP. Points are not cryptocurrency and no redemption wallet is connected.

## Current service contract

The app expects the Next.js endpoints at `/api/mobile/user`, `/api/mobile/reports`, `/api/mobile/verify`, `/api/mobile/collect`, `/api/mobile/rewards`, and `/api/mobile/leaderboard`. Waste reports support multiple material selections and a camera/gallery photo. `/api/mobile/verify` sends that photo to Gemini and returns the detected materials, estimated amount, confidence, and notes in the selected app language. The backend should be running with its database and server-side Gemini key configured before using live reports.

## Maps

Mobile collector tracking uses Leaflet tiles from OpenStreetMap and needs no mapping key. Keep the map attribution visible and see [`MAPS_SETUP.md`](MAPS_SETUP.md) for tile service guidance.

## Commands

- `npx expo start`
- `npx expo lint`
- `npx tsc --noEmit`
