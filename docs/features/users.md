# Users (legacy ticket users)

## Feature overview

The **Users** page manages accounts for the **original ticket workflow** (Admin, Supervisor, Worker roles). This is **separate** from **Application Access**, which controls modern login and module permissions.

### Why it still exists

- Ticket assignment lists and legacy APIs may reference these users.
- Admins maintain ticket-specific roles here.

### When to use it

- When your administrator directs you to manage ticket roles on `/users`.
- For opening **User History** analytics.

**Access:** **Admin role only**.

---

## Users list

| Column | Meaning |
|--------|---------|
| Username | Login |
| Display Name | Shown on tickets |
| Email | Optional |
| Role | Admin, Supervisor, or Worker |
| Active | Account on/off |

### Actions

| Action | Purpose |
|--------|---------|
| **Create** | New ticket user |
| **Edit** | Update name, email, role, password |
| **Delete** | Remove user |
| **History** | Open user performance page |

---

## Create / edit user form

| Field | Create | Edit |
|-------|--------|------|
| Username | Required | Required |
| Display Name | Required | Required |
| Email | Optional (validated) | Optional |
| Password | Required | Set new or leave per form behavior |
| Role | Admin / Supervisor / Worker | Same |
| Active | Toggle | Toggle |

---

## User History

**Path:** Users → select user → **History**

**Access:** Admin only.

Shows for a chosen **reporting period** (Today, 7, 14, 30, 60, 90 days):

- Open assigned count, resolved count, SLA compliance, average resolution time
- Status breakdown chart
- Resolved-per-day chart
- Recent tickets and activity feed

Use for coaching and workload review—not for payroll.

---

## Application Access vs Users

| Question | Use |
|----------|-----|
| New employee needs Samanvi login | **Application Access** |
| Ticket role or display name for legacy flow | **Users** (if your org still uses it) |
| Module permissions (garage, masters) | **Application Access** |

Ask your administrator which system is authoritative for your team.

---

## Related guides

- [Application Access](application-access.md)
- [Roles and permissions](../roles-and-permissions.md)
