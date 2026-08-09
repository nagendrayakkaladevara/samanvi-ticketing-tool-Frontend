# Unit Test Instructions

Production-grade unit testing standard for the Samanvi Issue Report frontend (`samanviissuereport`). Follow this document when adding, extending, or reviewing unit tests.

**Coverage goal:** **≥ 95%** line, function, and statement coverage for all in-scope production code, with **≥ 92%** branch coverage as the current CI gate (raise to 95% as remaining API-normalizer alternate-key branches are closed). Every reachable edge case in pure logic, services, stores, and hooks should have an explicit test.

---

## 1) Purpose and Scope

### In scope (must be unit-tested)

| Layer | Paths | Why |
|-------|--------|-----|
| Pure utils / models | `src/features/*/utils/**`, `src/lib/utils/**`, `src/lib/auth/**`, `src/features/*/utils/**` | Deterministic business rules |
| Permission logic | `src/features/auth/utils/**`, `src/features/permissions/utils/**`, `src/features/application-users/utils/**` | Security-critical |
| Status / workflow rules | e.g. `ticket-status-transition.ts`, `job-status-transition.ts` | Incorrect transitions cause data bugs |
| API services | `src/features/*/api/*.service.ts` | Request shape, normalization, error mapping |
| Shared API / errors | `src/lib/api/**` | Auth headers, 401 logout, `ApiError` |
| Zustand stores | `src/store/**` | Session persistence, permission sets |
| Shared hooks (logic) | `src/hooks/**`, `src/features/*/hooks/**` | Query keys, derived state, side effects |
| Config / env guards | `src/config/env.ts` (via controlled mocks) | Startup correctness |
| Route / redirect helpers | `src/lib/auth/**`, route permission helpers | Open-redirect and access safety |

### Out of scope for unit tests (cover elsewhere)

- Visual layout / CSS-only concerns in `src/components/ui` (smoke or component tests if needed)
- Full E2E browser flows (Playwright/Cypress)
- Third-party library internals (`ag-grid`, Radix, Recharts, jsPDF drawing internals)
- Generated / build artifacts (`dev-dist/`, service worker bundles)
- Static assets and pure presentational wrappers with no branching logic

When a UI component embeds non-trivial logic, **extract** that logic into a util/hook and unit-test the extraction. Do not leave business rules only inside JSX.

---

## 2) Tooling Standard

This repo is Vite + React 19 + TypeScript. Use:

| Tool | Role |
|------|------|
| **Vitest** | Test runner (aligned with Vite) |
| **@testing-library/react** | Component / hook rendering |
| **@testing-library/user-event** | User interactions |
| **@testing-library/jest-dom** | DOM matchers |
| **jsdom** | Browser-like environment |
| **@vitest/coverage-v8** | Coverage reports |
| **MSW** (optional) or `vi.mock` | HTTP / module mocking |

### Required npm scripts

Once tooling is installed, scripts must include:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Vitest config expectations (`vitest.config.ts` or `vite.config.ts` test block)

- `environment: 'jsdom'`
- Alias `@` → `./src` (same as Vite)
- Coverage provider: `v8`
- Coverage thresholds (fail CI if unmet):

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  thresholds: {
    lines: 95,
    functions: 95,
    branches: 92,
    statements: 95,
  },
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/main.tsx',
    'src/app/**',
    'src/pages/**',
    'src/components/ui/**',
    'src/styles/**',
    'src/**/*.d.ts',
    'src/features/**/types/**',
    '**/*.test.{ts,tsx}',
    '**/__tests__/**',
    '**/__mocks__/**',
  ],
}
```

Adjust `exclude` only with documented justification. Prefer raising coverage over expanding excludes. If a file is hard to unit-test because of coupling, refactor for testability rather than excluding it.

### Setup file

Provide `src/test/setup.ts` that:

1. Imports `@testing-library/jest-dom/vitest`
2. Clears `localStorage` / `sessionStorage` between tests
3. Resets Zustand stores between tests
4. Calls `vi.clearAllMocks()` in `afterEach`
5. Sets a stable timezone if date tests depend on local formatting (document any remaining locale assumptions)

---

## 3) File Placement and Naming

Mirror source structure. Prefer colocated tests:

```text
src/features/tickets/utils/ticket-status-transition.ts
src/features/tickets/utils/ticket-status-transition.test.ts

src/lib/api/client.ts
src/lib/api/client.test.ts

src/store/auth-store.ts
src/store/auth-store.test.ts
```

Rules:

- Name: `<module>.test.ts` or `<module>.test.tsx`
- One primary module under test per file (helpers for fixtures may be shared)
- Shared fixtures: `src/test/fixtures/<domain>.ts`
- Shared mocks: `src/test/mocks/<name>.ts`
- Do **not** put tests under `docs/` or repo root

---

## 4) Quality Bar (Production Grade)

Every unit test file must satisfy all of the following:

1. **Arrange–Act–Assert** structure; one logical behavior per `it`/`test`
2. **Descriptive names:** `it('returns null when transitioning from completed to closed is allowed')` — not `it('works')`
3. **No flaky timing:** prefer fake timers (`vi.useFakeTimers()`) for clocks, debounce, and timeouts
4. **No real network:** always mock `apiClient` or intercept HTTP
5. **No hidden shared mutable state** across tests; reset stores and storage
6. **Assert behavior and contracts**, not implementation trivia (e.g. do not assert private call order unless it is a security/auth contract)
7. **Edge cases first-class:** empty, nullish, invalid, boundary, and adversarial inputs are mandatory where the function accepts them
8. **Type-safe fixtures:** fixtures should satisfy domain types; use `as const` / satisfies where helpful
9. **Deterministic:** same input → same assertion every run
10. **Fast:** pure util suites should complete in milliseconds; avoid unnecessary renders

### Definition of done for a module

A module is done only when:

- [ ] Happy path covered
- [ ] All branches / early returns covered
- [ ] Null, undefined, empty string, empty array, empty object covered where accepted
- [ ] Invalid / malformed payloads covered for normalizers
- [ ] Boundary values covered (min/max lengths, date windows, enum edges)
- [ ] Error paths covered (thrown `ApiError`, 401, 4xx/5xx message extraction)
- [ ] Idempotent / no-op paths covered (e.g. same status → same status)
- [ ] Security edges covered where relevant (open redirect, admin bypass, missing token)
- [ ] Coverage for that file is ≥ 95% on all metrics

---

## 5) Edge-Case Catalog (Mandatory Patterns)

Apply these catalogs whenever the corresponding concern appears.

### 5.1 Strings and whitespace

- `''`, `'   '`, leading/trailing spaces, unicode, very long strings
- Trim-sensitive validators (e.g. garage status notes: whitespace-only vs empty)
- Max length boundaries: `STATUS_NOTE_MAX_LENGTH` (2000), `2000`, `2001`

### 5.2 Nullish and missing fields

- `null`, `undefined`, missing keys on API payloads
- Optional nested objects (`permissions?.items`, `ticket.ticketNumber ?? '—'`)
- Alternate API key shapes (`id` vs `permissionId` vs `_id`)

### 5.3 Numbers and dates

- `NaN`, `Infinity`, non-integers, negative numbers
- Allowed window days only: `[0, 1, 2, 6, 14, 30, 60, 90]` — reject others
- Date formats: `DD-MM-YYYY`, ISO strings, invalid dates, empty
- Master date highlight: past → `expired`; today through +6 days → `warning`; beyond → `null`
- SLA overdue: empty/invalid → not overdue; past timestamp → overdue; future → not overdue
- Use fixed `Date` with `vi.setSystemTime(...)` for overdue/warning tests

### 5.4 Collections

- Empty arrays, single element, large lists
- Duplicate keys when building `Set`s / maps
- Sort stability (equal timestamps → tie-break by `id`)

### 5.5 Enums and status machines

For **tickets** (`ticket-status-transition.ts`):

| From | To | Expected |
|------|----|----------|
| `IN_PROGRESS` | `CLOSED` | Invalid — resolve-before-close message |
| not `CLOSED` | `REOPENED` | Invalid — reopen-only-from-closed message |
| any other allowed pair | — | `null` message |
| target `RESOLVED` | — | note required |
| other targets | — | note not required |

For **garage jobs** (`job-status-transition.ts`):

- Exhaustively test `ALLOWED_STATUS_TRANSITIONS` for every `JobStatus`
- Same status → valid / no error message
- Terminal statuses (`closed`, `cancelled`) → no outbound transitions; selectable options = `[current]`
- Note required for `completed` and `on_hold`
- Blank note when not required but whitespace present → `'Note cannot be blank.'`
- Note over max length → length error

Do not sample a few transitions — **table-drive all from→to pairs** (or all allowed + representative illegal pairs covering every branch).

### 5.6 Permissions and auth

- Admin (`isAdmin = true`) bypasses all checks
- Empty permission set denies non-admin protected actions
- `authOnly` / missing requirement → allow for authenticated flows per `canAccessRoute`
- `anyOf` OR semantics vs single module/submodule/action
- Default action `'view'` when action omitted
- Default submodule `''` when omitted
- `getFirstAllowedRoute`: unauthenticated → `/login`; no matching nav → `/tickets` fallback
- Permission key format: `module:submodule:action`
- Catalog normalization: nested `data`, `items` vs `permissions`, tree vs rebuild-from-items

### 5.7 Redirect / open-redirect safety

`getPostLoginRedirect`:

- Query `redirect=/tickets` → allowed
- `redirect=//evil.com` → rejected (must not treat as safe)
- `redirect=https://evil.com` → rejected
- `state.from` safe path used when query absent/invalid
- Default `'/'` when neither is safe

### 5.8 API client / services

- Attaches `Authorization: Bearer <token>` when token exists and header absent
- Does not overwrite existing `Authorization` / `authorization` header
- No token → no auth header
- Response success passthrough
- Error → throws `ApiError` with message from `response.data.message` or fallback
- Status `401` → calls `logout()`
- Service normalizers: unknown status strings → safe defaults (e.g. ticket status → `CREATED`)
- Request mappers: UI enums → API snake_case statuses

### 5.9 Auth store / persistence

- Invalid JSON in storage → cleared, session `null`
- `persist: true` → `localStorage`, clears `sessionStorage`
- `persist: false` → `sessionStorage`, clears `localStorage`
- `logout` clears both storages and resets permission set
- `updatePermissions` no-ops when no session
- `getAccessToken` falls back to stored session when memory token missing

### 5.10 Filters and routing helpers

- Ticket list filter type guards: every known value true; unknown false
- Labels for API, aggregate, and special filters
- `parseTicketListWindowDays`: `null` / `''` / invalid → preference fallback
- `queueStatusToTicketListFilter` / `dashboardSummaryCardToFilter`: known maps + `null` default
- Path builders include correct query (`days=`)

---

## 6) Testing Patterns by Layer

### 6.1 Pure functions (preferred first)

```ts
import { describe, expect, it } from 'vitest'
import {
  getInvalidStatusTransitionMessage,
  RESOLVE_BEFORE_CLOSE_MESSAGE,
} from './ticket-status-transition'

describe('getInvalidStatusTransitionMessage', () => {
  it('blocks closing an in-progress ticket without resolving first', () => {
    expect(getInvalidStatusTransitionMessage('IN_PROGRESS', 'CLOSED')).toBe(
      RESOLVE_BEFORE_CLOSE_MESSAGE,
    )
  })

  it('allows unrelated transitions that are not explicitly blocked', () => {
    expect(getInvalidStatusTransitionMessage('ASSIGNED', 'IN_PROGRESS')).toBeNull()
  })
})
```

Use `it.each` / `describe.each` for matrix coverage:

```ts
it.each([
  ['created', 'assigned', true],
  ['created', 'in_progress', false],
  ['closed', 'assigned', false],
] as const)('isValidStatusTransition(%s → %s) === %s', (from, to, expected) => {
  expect(isValidStatusTransition(from, to)).toBe(expected)
})
```

### 6.2 Normalizers / model mappers

For every `*model.ts` and permission normalizer:

1. Fixture: minimal valid payload
2. Fixture: full payload with all optional fields
3. Fixture: alternate key names used by backend
4. Fixture: garbage / partial → `null` or defaults
5. Assert output shape field-by-field (not only truthiness)

### 6.3 API services

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api/client'
import { fetchTickets /* example */ } from './tickets.service'

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('tickets.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps UI status to API status on update', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { /* ... */ } })
    // call service, assert apiClient.patch URL + body
  })

  it('normalizes unknown ticket status to CREATED', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: '1', status: 'not-a-real-status', title: 'x' },
    })
    // assert normalized status
  })
})
```

Rules:

- Mock `@/lib/api/client`, not `axios` globally, unless testing the client itself
- Assert HTTP method, path, query params, and body
- Assert thrown `ApiError` when the client rejects
- Cover list + detail + create + update + delete paths present in the service

### 6.4 Testing `apiClient` interceptors

- Mock `getAccessToken` / `useAuthStore`
- Simulate Axios adapter or spy interceptor behavior via injected error/response objects
- Cover AxiosHeaders-like `.get('Authorization')` and plain object headers

### 6.5 Zustand stores

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth-store'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.getState().logout()
  })

  it('persists session to localStorage by default', () => {
    useAuthStore.getState().setSession(sessionFixture, true)
    expect(JSON.parse(localStorage.getItem('samanvi.auth.session')!)).toMatchObject({
      accessToken: sessionFixture.accessToken,
    })
    expect(sessionStorage.getItem('samanvi.auth.session')).toBeNull()
  })
})
```

### 6.6 Hooks (React Query / custom)

Wrap with providers:

```tsx
function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
```

- Disable retries to keep failure tests fast/deterministic
- Prefer testing hook logic with `renderHook`
- Assert query keys, enabled flags, select/transform output, and error UI state

### 6.7 Components with behavior

Only when the component contains meaningful branching (guards, conditional CTAs):

- Use Testing Library queries (`getByRole`, `getByLabelText`) — avoid tightly coupled class/DOM structure asserts
- Mock feature hooks/services; do not hit the network
- Cover permission-denied vs allowed rendering for auth guards

---

## 7) Priority Order for Writing Tests

Implement coverage in this order so critical risk is protected first:

1. **Security & access:** `permission-checks`, `permission-normalize`, auth store, API 401/logout, post-login redirect
2. **Workflow integrity:** ticket + garage status transitions and note validation
3. **Data normalization:** ticket/garage/employee/master models and list filters
4. **Dates & SLA:** `master-dates`, SLA overdue/format helpers
5. **API services:** request/response contracts per feature
6. **Shared hooks / stores / remaining utils**
7. **Behavioral components** (guards, forms with validation)

Do not start with shallow UI snapshot tests.

---

## 8) Feature Checklist (Repository Map)

Use this as a work queue. Each bullet is a required test module (or modules) targeting ≥ 95% for those files.

### Core / shared

- [ ] `src/lib/api/api-error.ts`
- [ ] `src/lib/api/client.ts`
- [ ] `src/lib/auth/get-post-login-redirect.ts`
- [ ] `src/lib/utils/master-dates.ts`
- [ ] `src/lib/utils/master-api.ts`
- [ ] `src/lib/utils/file-to-base64.ts`
- [ ] `src/lib/utils.ts` (`cn`)
- [ ] `src/store/auth-store.ts`
- [ ] `src/store/ui-store.ts`
- [ ] `src/config/env.ts` (missing env throws)

### Auth & permissions

- [ ] `src/features/auth/utils/permission-checks.ts`
- [ ] `src/features/auth/api/auth.service.ts`
- [ ] `src/features/auth/api/permissions-me.service.ts`
- [ ] `src/features/permissions/utils/permission-normalize.ts`
- [ ] `src/features/application-users/utils/*`

### Tickets

- [ ] `ticket-status-transition.ts`
- [ ] `ticket-list-filter.ts`
- [ ] `ticket-list-model.ts`
- [ ] `ticket-routes.ts`, `ticket-share.ts`
- [ ] `tickets.service.ts` (+ hooks that encode logic)

### Garage

- [ ] `job-status-transition.ts` (full matrix)
- [ ] `job-list-model.ts`, `job-activity-model.ts`, `job-part-model.ts`
- [ ] `job-repeat-model.ts`, `repair-category-model.ts`, `repair-part-model.ts`
- [ ] `job-routes.ts`, `job-share.ts`
- [ ] `garage.service.ts`

### Masters / employees / other features

- [ ] Employee models (`driver`, `helper`, `office-staff`, shared)
- [ ] `master-bus-model.ts`, service-number / spare-tank / service-for models
- [ ] Feature services: buses, dashboard, notifications, profile, users, user-history, application-users, spare-tanks, service-numbers, service-for, master-buses
- [ ] Export helpers (PDF/Excel): mock `jspdf` / `xlsx`; assert invoked with expected row/column data, not binary snapshots

### Shared hooks

- [ ] `use-permissions`, `use-current-user`, `use-network-status`, `use-dark-mode`, `use-master-dialog-params`, etc. — focus on branching logic

---

## 9) Coverage Enforcement Rules

1. Run `npm run test:coverage` before merging test work.
2. Global thresholds must stay at **95%** for lines, branches, functions, statements on included files.
3. New production code in-scope **must** ship with tests in the same PR.
4. Do not lower thresholds to make CI green.
5. If a branch is unreachable, delete the dead code or test the reachable design — do not leave untested branches.
6. Branch coverage gaps are failures even when line coverage looks high — pay special attention to `&&`, `||`, ternaries, and default parameters.

---

## 10) Mocking and Fixture Guidelines

### Do

- Create small, readable fixtures per domain (`makeTicket()`, `makeJob()`, `makePermission()`)
- Override one field per scenario: `makeTicket({ status: 'CLOSED' })`
- Mock at module boundaries (`@/lib/api/client`, feature services, `zustand` only when necessary)
- Prefer dependency injection / pure functions when adding new code

### Do not

- Share mutable fixture objects across tests without cloning
- Mock the unit under test
- Use real timers for debounce/SLA unless necessary
- Snapshot huge DOM trees as a substitute for assertions
- Hit `VITE_API_BASE_URL` network endpoints

### Environment

- Ensure tests set `VITE_API_BASE_URL` (Vitest `env` / `.env.test`) so `src/config/env.ts` does not throw during import unless that throw is the scenario under test

---

## 11) Anti-Patterns (Reject in Review)

- Tests that only assert `toBeDefined()` without behavior
- Testing private implementation details that duplicate the source line-by-line
- Partial status-machine coverage (“samples” instead of matrices)
- Ignoring whitespace/null paths on validators
- Leaving 401 / logout untested in the API client
- Excluding large feature folders from coverage without cause
- Intermittent tests depending on wall-clock time without faking timers
- Coupling tests to Tailwind class strings unless the class is the specified contract (e.g. master date highlight class helper)

---

## 12) Example: Exhaustive Transition Matrix Template

```ts
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_STATUS_TRANSITIONS,
  isValidStatusTransition,
  type /* JobStatus imported from types */,
} from './job-status-transition'

const ALL_STATUSES = Object.keys(ALLOWED_STATUS_TRANSITIONS) as JobStatus[]

describe('isValidStatusTransition matrix', () => {
  describe.each(ALL_STATUSES)('from %s', (from) => {
    it.each(ALL_STATUSES)('to %s', (to) => {
      const expected = from === to || ALLOWED_STATUS_TRANSITIONS[from].includes(to)
      expect(isValidStatusTransition(from, to)).toBe(expected)
    })
  })
})
```

Apply the same exhaustive approach to permission key building, filter type guards, and date highlight windows.

---

## 13) Agent / Developer Workflow

When asked to “add unit tests” or implement features:

1. Read this file and `ARCHITECTURE.md`.
2. Identify the module’s branches and edge cases using §5–§6.
3. Add or extend `*.test.ts(x)` colocated with the source.
4. Run `npm run test` and `npm run test:coverage`.
5. Fix production code only if tests reveal a real bug; do not weaken assertions to match buggy behavior without an explicit product decision.
6. Update the §8 checklist as modules reach ≥ 95%.
7. Summarize: files tested, coverage %, residual excludes, and any bugs found.

### Suggested commit message style

```text
test: add unit coverage for garage status transitions
test: cover auth store persistence edge cases
test: raise tickets.service normalization coverage
```

---

## 14) Minimal First-Slice Recommendation

If introducing the suite from zero, land tooling + highest-risk tests first:

1. Add Vitest + Testing Library + coverage tooling and scripts
2. `permission-checks.test.ts`
3. `permission-normalize.test.ts`
4. `ticket-status-transition.test.ts`
5. `job-status-transition.test.ts`
6. `get-post-login-redirect.test.ts`
7. `auth-store.test.ts`
8. `client.test.ts` (API interceptors)
9. `master-dates.test.ts`
10. Expand feature services and models until global ≥ 95%

This order maximizes production safety per test added while converging on the coverage target.
