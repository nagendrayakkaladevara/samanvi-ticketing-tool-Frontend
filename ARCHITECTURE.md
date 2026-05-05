# Frontend Architecture Guide

This document defines the production-ready React architecture for the Bus Issue Ticketing System described in `docs/prd.md`.

## 1) High-Level Architecture

- **Architecture style:** Feature-first modular monolith.
- **Rendering model:** SPA with `react-router-dom`.
- **UI system:** Tailwind CSS + `shadcn/ui` primitives from `src/components/ui`.
- **Server state:** `@tanstack/react-query` for fetching, caching, and async state.
- **Client state:** Local component state first, `zustand` for lightweight shared UI/app state.
- **Networking:** Centralized Axios client (`src/lib/api/client.ts`) + feature service modules.

Data flow:

1. Route page composes feature widgets.
2. Feature hooks call feature service modules.
3. Service modules call shared API client.
4. Query cache handles loading/stale/error lifecycle.
5. UI components remain reusable and mostly stateless.

## 2) Folder Structure and Responsibilities

```txt
src/
├── app/                  # app composition: providers, router, bootstrapping
│   ├── providers/
│   └── router/
├── features/             # domain modules (auth, tickets, buses, dashboard, users)
│   └── <feature>/
│       ├── api/          # feature API/service functions
│       ├── components/   # feature-scoped UI
│       ├── hooks/        # feature hooks and orchestration logic
│       └── types/        # feature domain types/DTOs
├── pages/                # route-level composition only (no deep business logic)
├── components/
│   ├── ui/               # shared shadcn/ui primitives
│   └── layout/           # app shell/nav/layout components
├── lib/
│   ├── api/              # API client, error normalization, interceptors
│   └── query/            # React Query setup/configuration
├── store/                # global non-server state (zustand slices)
├── hooks/                # shared hooks across features
├── config/               # env and static runtime config
├── services/             # cross-feature application services
├── types/                # shared app-wide types
├── utils/                # pure helper functions (domain-agnostic)
└── styles/               # global styling and design tokens
```

## 3) Code Organization Principles

- **Page components** (`src/pages`) are route composition containers only.
- **Feature modules** own their domain logic and should not leak internals.
- **Presentational vs container split:**
  - Presentational: stateless/pure UI in `components/ui` or feature `components`.
  - Container/orchestration: hooks in `features/*/hooks` or page components.
- **Business rules** belong in feature hooks/services, not in visual components.
- **Cross-feature reuse** should move to shared layers (`lib`, `hooks`, `types`, `utils`) only after duplication is proven.

## 4) Styling Strategy (Tailwind + shadcn/ui)

- Global design tokens are defined in `src/styles/globals.css` as CSS variables.
- Tailwind semantic utilities (`bg-background`, `text-foreground`, `text-muted-foreground`) are preferred over hardcoded colors.
- Shared primitive components use `cva` + `cn()` for consistent variants.
- Feature components should:
  - compose shared UI primitives from `src/components/ui`
  - keep class names readable and grouped by layout -> spacing -> typography -> state
  - avoid inline styles except runtime-computed values

## 5) API and Data Handling

- All HTTP access goes through `src/lib/api/client.ts`.
- Feature APIs live under `src/features/<feature>/api`.
- React Query is the default data-access boundary:
  - query keys owned by feature modules
  - retries and staleness handled centrally in `src/lib/query/query-client.ts`
- API errors are normalized with `ApiError` so UI/error boundaries can rely on consistent shape.

## 6) State Management Rules

- **Use local state** (`useState`, reducer) for component-only concerns.
- **Use React Query** for server state (lists, details, mutations, cache invalidation).
- **Use Zustand** for global client state that is not server data (UI preferences, global filters, ephemeral app context).
- **Avoid Context for mutable global state** unless values are static or very low-frequency.

## 7) Conventions for Future Agents and Developers

When adding a new feature:

1. Create `src/features/<feature>/{api,components,hooks,types}`.
2. Add service functions in `api`, then feature hooks in `hooks`.
3. Keep page-level files in `src/pages` thin; import feature modules there.
4. Add shared primitives to `src/components/ui` only if reused by multiple features.
5. If logic is domain-specific, keep it inside the feature even if reused inside that domain.

Naming conventions:

- Files: `kebab-case.ts(x)` for utils/services, `PascalCase.tsx` for components/pages.
- Hooks: `use-*.ts` or `use-*.tsx` with `use` prefix.
- Types: colocate within feature; promote to `src/types` only for truly shared contracts.

Boundary rules:

- Feature imports should not depend on other feature internals directly.
- Shared layers (`lib`, `components/ui`, `types`, `utils`) can be imported by features.
- Route declarations stay in `src/app/router`.

## 8) Suggested Implementation Sequence

1. Build auth and access control feature first (role-aware route guards).
2. Build tickets feature end-to-end (CRUD + assignment + status transitions + SLA).
3. Add buses history and dashboard analytics features.
4. Add users/admin management and audit trail views.

This sequence aligns with PRD core value delivery and reduces integration risk.
