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
