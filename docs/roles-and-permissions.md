# Roles and permissions

This guide explains **who can do what** in Samanvi—in plain language.

---

## Two ways access is controlled

### 1. Your role (ticket workflow)

Shown on your profile and Home screen: **ADMIN**, **SUPERVISOR**, **WORKER**, or **VIEWER**.

Controls ticket actions like status updates, comments, assignment, and access to some admin-only pages.

### 2. Your permissions (modules)

Fine-grained rights such as “can view garage repair jobs” or “can create bus masters.”

Set in **Application Access** when an admin creates or edits your account. **Admin** user type gets **all** permissions automatically.

---

## Ticket roles

| Role | Tickets list | Create ticket | Update status | Comment | Assign | Delete ticket | Board | Users page | Buses |
|------|--------------|---------------|---------------|---------|--------|---------------|-------|------------|-------|
| **ADMIN** | Yes* | Yes* | Yes* | Yes | Yes* | Yes | Yes | Yes | Yes |
| **SUPERVISOR** | Yes* | Yes* | Yes* | Yes | Yes* | Yes | No | No | Yes |
| **WORKER** | Yes* | Yes* | Limited* | Yes | No | No | No | No | No |
| **VIEWER** | Yes* | No | No | No | No | No | No | No | No |

\*Requires matching **ticket permission** (view, create, assign, update_status) in addition to role.

### Status targets by role

| Role | Can usually set |
|------|-----------------|
| Admin / Supervisor | Assigned, In Progress, Resolved, Closed; Reopened from Closed |
| Worker | In Progress, Resolved, Closed |
| Viewer | (none) |

---

## Application user types

| User type | Typical use |
|-----------|-------------|
| **Admin** | Full system access; all permissions |
| **Supervisor** | Operations oversight |
| **Chairman** | Executive visibility (permissions vary) |
| **Accountant** | Financial / reporting areas |
| **Collection Agent** | Field collection workflows |
| **Worker** | Day-to-day data entry |

Exact access depends on **permissions** assigned to each account.

---

## Permission modules

| Module | What it controls |
|--------|------------------|
| **Tickets** | Ticket list, create, assign, update status |
| **Masters** | Service For, Bus No, Spare Tank, Service No, Drivers, Helpers, Office Staff |
| **Garage** | Repair jobs, repair categories, repair parts |
| **Application Users** | Application Access screens |
| **Issue Categories** | Ticket categories (backend; may be admin-managed) |

### Common actions

| Action | Meaning |
|--------|---------|
| **View** | See lists and details |
| **Create** | Add new records |
| **Edit** | Change existing records |
| **Delete** | Remove records |
| **Assign** | Assign tickets (tickets module) |
| **Update status** | Change ticket status |
| **Manage permissions** | Edit permission overrides on user accounts |

---

## Screen access quick reference

| Screen | Requirement |
|--------|-------------|
| Home, Settings | Any signed-in user |
| Tickets, Dashboard, Ticket details | Tickets → view (+ actions as granted) |
| Create ticket | Tickets → create |
| Board, Tickets by status, Users, User History | **ADMIN** role |
| Buses, Bus ticket history | **ADMIN** or **SUPERVISOR** |
| Application Access | Users → view (+ create/edit/delete) |
| Masters pages | Matching masters submodule → view |
| Garage pages | Matching garage submodule → view/create/edit |

---

## Why is my menu missing?

| Cause | What to do |
|-------|------------|
| No permission for that module | Ask admin to grant view access |
| Wrong ticket role | Ask admin to update role on Users or profile |
| Account inactive | Admin must reactivate |
| Admin-only page | Only admins see Board and Users |

---

## For administrators

Internal reference for permission keys is maintained in your organization’s Notion workspace (**Samanvi Ticketing — Backend Permissions Reference**). Use **permission keys** (not database IDs) when debugging access.

---

## Related guides

- [Application Access](features/application-access.md)
- [FAQ — Permissions](faq/README.md#permissions-and-access)
- [Troubleshooting](troubleshooting/README.md)
