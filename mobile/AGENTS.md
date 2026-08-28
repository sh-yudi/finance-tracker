# FinanceTracker Mobile App

React Native (Expo SDK 57) app for the FinanceTracker backend.

## Setup

- Backend API base URL is in `src/config.ts` (`API_BASE_URL`).
- For local dev on a physical device, set `API_BASE_URL` to your machine's LAN IP
  (e.g. `http://192.168.1.10:3000`) since `localhost` won't resolve on a device.

## Commands

- `npm start` — start Expo dev server
- `npm run ios` — run on iOS
- `npm run android` — run on Android
- `npm run web` — run in a browser

## Conventions

- Keep screens in `src/screens`, reusable UI in `src/components`, API state in
  `src/store` (Zustand), types in `src/types`, theme in `src/theme`.
- All API calls go through `src/api/client.ts` (handles auth token).
- No secrets in source — use env / app config.
