# Garage Module API

API reference for the **Garage** module — repair job tracking, repair category hierarchy, and spare parts catalog.

All Garage endpoints require a valid JWT unless noted otherwise.

**Base URL:** `{API_PREFIX}` (default `/api/v1`)  
**Garage prefix:** `/garage`  
**Full base:** `/api/v1/garage`

Interactive docs (when enabled): `GET /api/v1/docs` · OpenAPI JSON: `GET /api/v1/openapi.json`

---

## Table of contents

1. [Overview](#overview)
2. [Authentication & permissions](#authentication--permissions)
3. [Common conventions](#common-conventions)
4. [Repair categories](#1-repair-categories)
5. [Repair parts](#2-repair-parts)
6. [Repair jobs](#3-repair-jobs)
7. [Job status workflow](#job-status-workflow)
8. [Repeat jobs](#repeat-jobs)
9. [Validation reference](#validation-reference)
10. [Frontend integration notes](#frontend-integration-notes)

---

## Overview

The Garage module is grouped under a single route prefix:

| Sub-module        | Base path                              | Pagination | Auto-generated ID |
|-------------------|----------------------------------------|------------|-------------------|
| Repair Categories | `/garage/masters/repair-categories`    | No         | No                |
| Repair Parts      | `/garage/masters/repair-parts`         | Yes        | No                |
| Repair Jobs       | `/garage/jobs`                         | Yes        | Yes (`J01`)       |

### Module dependencies

```
Repair Category (leaf node) ──► Repair Job (repairCategoryId FK)
Bus (Master)                ──► Repair Job (busId via busNumber)
Driver (Master, optional)   ──► Repair Job (reportedDriverId)
Office Staff (Master, opt.) ──► Repair Job (assignedToOfficeStaffId)
Repair Part                 ──► Repair Job Part (repairPartId)
```

Recommended setup order:

1. Create **Repair Categories** (hierarchy, up to 5 levels).
2. Create **Repair Parts** (catalog with prices).
3. Ensure **Buses**, **Drivers**, and **Office Staff** exist in Master data.
4. Create and manage **Repair Jobs**; attach parts as work progresses.

---

## Authentication & permissions

### Headers

Every request must include:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Obtain a token via `POST /auth/login`.

### Feature permissions

| Feature               | Used for                                      | Admin | Supervisor | Worker |
|-----------------------|-----------------------------------------------|-------|------------|--------|
| `create_garage_job`   | Create repair jobs                            | Yes   | Yes        | No     |
| `manage_garage_job`   | Update jobs, add parts, delete jobs*          | Yes   | Yes        | Yes    |
| `manage_garage_masters` | Repair category & repair part mutations     | Yes   | Yes        | No     |

\* Workers can update jobs and add parts, but **cannot delete** repair jobs (returns `403`).

- **Read (GET)** endpoints: any authenticated role (admin, supervisor, worker).
- **Write (POST / PATCH / DELETE)** endpoints: require the feature above.

### Permission probes (optional)

Use these lightweight endpoints to check write access before showing action buttons:

```http
POST  /api/v1/garage/jobs                              → requires create_garage_job
PATCH /api/v1/garage/jobs/:jobId                       → requires manage_garage_job
POST  /api/v1/garage/masters/repair-categories         → requires manage_garage_masters
```

All return `200` with `{ "success": true, "data": { "message": "..." } }` when allowed, or `403` when forbidden.

---

## Common conventions

### Success response envelope

```json
{
  "success": true,
  "data": { ... }
}
```

Paginated list responses also include `meta`:

```json
{
  "success": true,
  "data": { "items": [ ... ] },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error response envelope

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

Common HTTP status codes: `400` validation, `403` forbidden, `404` not found, `409` conflict.

### Pagination query params

| Name   | Type    | Default | Constraints   |
|--------|---------|---------|---------------|
| `page` | integer | `1`     | min 1         |
| `limit`| integer | `20`    | min 1, max 100|

### Decimal amounts

Monetary fields (`price`, `unitPrice`) are stored as decimals and returned as **strings** in JSON (e.g. `"150.00"`) to avoid floating-point precision issues.

---

## 1. Repair categories

Hierarchical taxonomy for classifying repair work. Maximum depth is **5 levels**. Jobs must reference a **leaf** category (no subcategories).

### List categories (flat + tree)

```http
GET /garage/masters/repair-categories
```

**Auth:** Any authenticated user.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clx...",
        "name": "Engine",
        "level": 1,
        "parentId": null,
        "createdAt": "2026-05-26T10:00:00.000Z",
        "updatedAt": "2026-05-26T10:00:00.000Z"
      }
    ],
    "tree": [
      {
        "id": "clx...",
        "name": "Engine",
        "level": 1,
        "parentId": null,
        "children": [
          {
            "id": "clx...",
            "name": "Oil Change",
            "level": 2,
            "parentId": "clx...",
            "children": [],
            "createdAt": "...",
            "updatedAt": "..."
          }
        ],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

### Create category

```http
POST /garage/masters/repair-categories
```

**Auth:** `manage_garage_masters`

**Body**

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `name`     | string | Yes      | 1–120 chars                          |
| `parentId` | string | No       | Parent category ID; omit for root    |

**Response `201`** — created category object.

**Errors**

- `404` — parent category not found
- `409` — duplicate name at the same level
- `400` — exceeds max depth (5 levels)

### Update category

```http
PATCH /garage/masters/repair-categories/:categoryId
```

**Auth:** `manage_garage_masters`

**Body**

| Field  | Type   | Required | Description |
|--------|--------|----------|-------------|
| `name` | string | Yes      | 1–120 chars |

**Response `200`** — updated category object.

### Delete category

```http
DELETE /garage/masters/repair-categories/:categoryId
```

**Auth:** `manage_garage_masters`

**Response `200`**

```json
{
  "success": true,
  "data": { "id": "clx..." }
}
```

**Errors**

- `409` — category has subcategories or is referenced by repair jobs

---

## 2. Repair parts

Catalog of spare parts with prices. Parts can be attached to repair jobs; the price is snapshotted at the time of attachment.

### List parts

```http
GET /garage/masters/repair-parts
```

**Auth:** Any authenticated user.

**Query:** `page`, `limit` (see [pagination](#pagination-query-params)).

**Response `200`** — paginated list of parts.

### Get part by ID

```http
GET /garage/masters/repair-parts/:partId
```

**Auth:** Any authenticated user.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "partName": "Oil Filter",
    "price": "350.00",
    "description": "Standard oil filter",
    "createdAt": "2026-05-26T10:00:00.000Z",
    "updatedAt": "2026-05-26T10:00:00.000Z"
  }
}
```

### Create part

```http
POST /garage/masters/repair-parts
```

**Auth:** `manage_garage_masters`

**Body**

| Field         | Type   | Required | Description        |
|---------------|--------|----------|--------------------|
| `partName`    | string | Yes      | 1–120 chars, unique|
| `price`       | number | Yes      | Non-negative       |
| `description` | string | No       | 1–500 chars        |

**Response `201`** — created part object.

**Errors:** `409` — part name already exists.

### Update part

```http
PATCH /garage/masters/repair-parts/:partId
```

**Auth:** `manage_garage_masters`

**Body** — at least one field required:

| Field         | Type           | Description                    |
|---------------|----------------|--------------------------------|
| `partName`    | string         | 1–120 chars                    |
| `price`       | number         | Non-negative                   |
| `description` | string \| null | Set `null` to clear            |

**Response `200`** — updated part object.

### Delete part

```http
DELETE /garage/masters/repair-parts/:partId
```

**Auth:** `manage_garage_masters`

**Response `200`** — `{ "success": true, "data": { "id": "..." } }`

**Errors:** `409` — part is used on one or more repair jobs.

---

## 3. Repair jobs

Core workflow for bus repair tracking. Jobs receive an auto-generated ID (`J01`, `J02`, … up to `J9999`).

Deleted jobs are **soft-deleted** (`deletedAt` set) and excluded from all list/get queries.

### List all jobs

```http
GET /garage/jobs
```

**Auth:** Any authenticated user.

**Query parameters**

| Name                      | Type    | Description                                      |
|---------------------------|---------|--------------------------------------------------|
| `page`                    | integer | Page number (default 1)                          |
| `limit`                   | integer | Page size (default 20, max 100)                  |
| `status`                  | enum    | Filter by job status                             |
| `priority`                | enum    | Filter by priority                               |
| `assignedToOfficeStaffId` | string  | Filter by assignee                               |
| `busId`                   | string  | Filter by bus                                    |
| `isRepeatJob`             | boolean | Filter repeat jobs (`true` / `false`)            |

**Note:** This endpoint (and other job read endpoints) automatically processes any **due repeat jobs** before returning results.

**Response `200`** — paginated list of repair jobs.

### List jobs for an office staff member

```http
GET /garage/jobs/my
```

**Auth:** Any authenticated user.

**Query parameters** — same filters as list all, plus:

| Name                      | Type   | Required | Description                    |
|---------------------------|--------|----------|--------------------------------|
| `assignedToOfficeStaffId` | string | **Yes**  | Office staff ID to filter by   |

**Response `200`** — paginated list scoped to the given assignee.

**Errors:** `404` — office staff not found.

### Get job by ID

```http
GET /garage/jobs/:jobId
```

**Auth:** Any authenticated user.

**Response `200`** — full repair job object (see [Repair job object](#repair-job-object)).

### Create job

```http
POST /garage/jobs
```

**Auth:** `create_garage_job`

**Body**

| Field                     | Type   | Required | Description |
|---------------------------|--------|----------|-------------|
| `busNumber`               | string | Yes      | Must match an existing bus in Master (normalized) |
| `odometerReading`         | integer| Yes      | Non-negative |
| `repairCategoryId`        | string | Yes      | Must be a **leaf** category (no children) |
| `priority`                | enum   | Yes      | `low`, `medium`, `high`, `urgent` |
| `description`             | string | Yes      | Non-empty |
| `reportedDriverId`        | string | No       | Driver ID from Master |
| `assignedToOfficeStaffId` | string | No       | Active office staff (not left) |
| `status`                  | enum   | No       | Override initial status (see below) |

**Initial status logic**

- If `status` is provided in the body, that value is used.
- Otherwise: `assigned` when `assignedToOfficeStaffId` is set, else `created`.

**Response `201`** — created repair job.

**Errors**

- `404` — bus, category, or driver not found
- `400` — category is not a leaf node; invalid assignee (staff left or not found)

### Update job

```http
PATCH /garage/jobs/:jobId
```

**Auth:** `manage_garage_job`

**Body** — at least one field required:

| Field                     | Type           | Description |
|---------------------------|----------------|-------------|
| `odometerReading`         | integer        | Non-negative |
| `repairCategoryId`        | string         | Leaf category only |
| `priority`                | enum           | Job priority |
| `reportedDriverId`        | string \| null | Set `null` to unassign driver |
| `assignedToOfficeStaffId` | string \| null | Set `null` to unassign staff |
| `description`             | string         | Updated description |
| `status`                  | enum           | Must follow [status workflow](#job-status-workflow) |
| `scheduleRepeatFor`       | string         | ISO 8601 datetime; must be in the future |

**Response `200`** — updated repair job.

**Errors**

- `400` — invalid status transition; repeat date not in future; category not a leaf
- `404` — job, category, or driver not found

### Add part to job

```http
POST /garage/jobs/:jobId/parts
```

**Auth:** `manage_garage_job`

**Body**

| Field          | Type    | Required | Default | Description |
|----------------|---------|----------|---------|-------------|
| `repairPartId` | string  | Yes      | —       | Part from catalog |
| `quantity`     | integer | No       | `1`     | Min 1 |

The `unitPrice` is copied from the part's current catalog price at attachment time.

**Response `201`** — full repair job object including updated `parts` array.

**Errors:** `404` — job or part not found.

### Delete job (soft delete)

```http
DELETE /garage/jobs/:jobId
```

**Auth:** `manage_garage_job` (admin or supervisor only — workers get `403`)

**Response `200`**

```json
{
  "success": true,
  "data": { "id": "clx..." }
}
```

---

### Repair job object

```json
{
  "id": "clx...",
  "jobIdNumber": "J01",
  "odometerReading": 125000,
  "priority": "high",
  "description": "Engine overheating on route 42",
  "status": "in_progress",
  "isRepeatJob": false,
  "previousJobId": null,
  "repeatScheduledFor": null,
  "repeatProcessedAt": null,
  "createdAt": "2026-05-26T10:00:00.000Z",
  "updatedAt": "2026-05-26T11:30:00.000Z",
  "bus": {
    "id": "clx...",
    "busNumber": "BUS-001"
  },
  "repairCategory": {
    "id": "clx...",
    "name": "Cooling System",
    "level": 2
  },
  "reportedDriver": {
    "id": "clx...",
    "driverIdNumber": "D0001",
    "dlName": "John Doe"
  },
  "assignedToOfficeStaff": {
    "id": "clx...",
    "staffIdNumber": "S0001",
    "nickName": "Mike",
    "aadharName": "Michael Smith",
    "designation": "Mechanic"
  },
  "createdBy": {
    "id": "clx...",
    "username": "admin",
    "displayName": "Admin User"
  },
  "previousJob": null,
  "parts": [
    {
      "id": "clx...",
      "quantity": 2,
      "unitPrice": "350.00",
      "createdAt": "2026-05-26T11:00:00.000Z",
      "repairPart": {
        "id": "clx...",
        "partName": "Coolant Hose"
      },
      "addedBy": {
        "id": "clx...",
        "username": "supervisor1",
        "displayName": "Supervisor One"
      }
    }
  ]
}
```

Optional relations (`reportedDriver`, `assignedToOfficeStaff`, `previousJob`) may be `null` when not set.

---

## Job status workflow

Allowed transitions (invalid transitions return `400`):

| Current status | Can transition to |
|----------------|-------------------|
| `created`      | `assigned`, `cancelled` |
| `assigned`     | `in_progress`, `on_hold`, `cancelled` |
| `in_progress`  | `on_hold`, `completed`, `cancelled` |
| `on_hold`      | `in_progress`, `assigned`, `cancelled` |
| `completed`    | *(terminal — no transitions)* |
| `cancelled`    | *(terminal — no transitions)* |

### Priority values

`low` · `medium` · `high` · `urgent`

---

## Repeat jobs

When a job is **completed**, you can schedule a follow-up by PATCHing `scheduleRepeatFor` with a future ISO 8601 datetime.

When any job list or get endpoint runs, the backend checks for due repeat schedules and automatically:

1. Creates a **new** repair job cloned from the source (marked `isRepeatJob: true`, linked via `previousJobId`).
2. Sets the source job's `repeatProcessedAt` so it is not processed again.

The new repeat job starts as `assigned` (if the source had an assignee) or `created`.

---

## Validation reference

| Field / rule | Constraint |
|--------------|------------|
| Repair category name | 1–120 chars; unique per parent |
| Repair category depth | Max 5 levels |
| Repair part name | 1–120 chars; globally unique |
| Repair part price | Non-negative decimal |
| Repair part description | 1–500 chars (optional) |
| Job bus number | Must exist in Buses master |
| Job repair category | Must be a leaf node (no subcategories) |
| Job assignee | Active office staff only (`dateOfLeaving` must be null) |
| Job ID format | `J` + zero-padded number (`J01` … `J9999`) |
| Repeat schedule | ISO datetime, must be in the future |
| Delete repair job | Admin and supervisor only |

---

## Frontend integration notes

1. **Category picker** — Use `data.tree` from the categories list for nested UI; only allow selection of nodes with empty `children` when creating/editing jobs.

2. **Bus lookup** — Pass `busNumber` (not `busId`) when creating a job. The backend normalizes the bus number.

3. **Assignee filter** — Use `GET /garage/jobs/my?assignedToOfficeStaffId=<id>` for a staff member's job board.

4. **Price display** — Parse `unitPrice` and `price` strings as decimals for totals; do not use raw JavaScript `number` arithmetic on catalog prices without a decimal library.

5. **Permission-gated UI**
   - Hide "Create job" unless `POST /garage/jobs` probe succeeds.
   - Hide master CRUD unless `POST /garage/masters/repair-categories` probe succeeds.
   - Hide "Delete job" for worker role even though they can update jobs.

6. **Status buttons** — Derive available next statuses from the [workflow table](#job-status-workflow); do not offer transitions from terminal states.

7. **Parts on jobs** — There is no remove-part endpoint; parts are append-only. Plan UI accordingly.

8. **Related Master APIs** — Buses, drivers, and office staff are documented in [master-api.md](./master-api.md).
