# Samanvi Issue Report Frontend

Frontend application for issue/ticket management in the Samanvi workflow.  
Built with React, TypeScript, and Vite.

## Features

- Authentication flow with protected and public-only routes
- Role-aware navigation and page access (`ADMIN`, `SUPERVISOR`, `WORKER`, `VIEWER`)
- Ticket list, ticket details, and timeline activity view
- Ticket creation flow with category and assignment support
- Admin-focused pages for dashboard, board, and user management

## Tech Stack

- React 19 + TypeScript
- Vite 8
- React Router 7
- TanStack Query
- Zustand
- Axios
- Tailwind CSS + shadcn/ui + Radix UI

## Routes Overview

- `/login` - Sign in
- `/tickets` - Ticket listing (authenticated users)
- `/tickets/create` - Create ticket (`ADMIN`, `SUPERVISOR`)
- `/tickets/:ticketId` - Ticket details
- `/dashboard` - Dashboard (`ADMIN`)
- `/board` - Board (`ADMIN`)
- `/users` - User management (`ADMIN`)
- `/buses` - Buses (`ADMIN`, `SUPERVISOR`)
- `/settings` - User settings

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_API_BASE_URL` is required. The app will fail at startup if it is missing.

## Getting Started

```bash
npm install
npm run dev
```

By default, Vite starts with `--host`, so it is accessible on your local network.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run cap:sync` - Build web assets and sync to Android
- `npm run android:debug` - Build a debug APK (requires Android SDK)
- `npm run android:release` - Build a release APK (requires signing config)

## Android APK (Capacitor)

This app can be packaged as a native Android APK using [Capacitor](https://capacitorjs.com/).

### Prerequisites

- Node.js 20+
- Java JDK 17+ (21 recommended)
- [Android SDK](https://developer.android.com/studio) with platform tools and build tools
- Set `ANDROID_HOME` (or create `android/local.properties` with `sdk.dir=/path/to/android-sdk`)

### Build debug APK

1. Set the API URL in `.env` (see Environment Variables above).
2. Install dependencies: `npm install`
3. Build and package:

```bash
npm run android:debug
```

The debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a device with USB debugging enabled:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Open in Android Studio

```bash
npm run cap:sync
npm run cap:open:android
```

Use Android Studio to run on an emulator, configure app icons, or create a signed release build for Play Store distribution.

## Project Structure

```text
src/
  app/          # app root, providers, router
  components/   # shared UI and layout components
  config/       # runtime config and env handling
  features/     # domain modules (auth, tickets, users)
  hooks/        # shared hooks
  lib/          # API client, helpers, query client
  pages/        # route-level pages
  store/        # zustand stores
  styles/       # global and feature styles
```
