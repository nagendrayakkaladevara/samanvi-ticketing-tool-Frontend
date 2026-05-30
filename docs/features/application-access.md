# Application Access

## Feature overview

**Application Access** is where authorized staff **create and manage login accounts** for Samanvi—separate from the older **Users** page used for ticket roles.

### Why users use it

- Onboard new employees.
- Turn accounts on or off.
- Control which modules each person can view or edit.

### When to use it

- New hire setup.
- Role change or promotion.
- Removing access when someone leaves.

**Permission:** View on **Application Users**; create/edit/delete/manage permissions as granted.

---

## Application Access list

**Path:** Application Access in sidebar

### Columns

| Column | Meaning |
|--------|---------|
| Name | Full name |
| Username | Login name |
| Mobile | 10-digit mobile |
| Email | Optional email |
| User Type | Supervisor, Chairman, etc. |
| Permission Overrides | Count of custom permissions |
| Status | Active or Inactive |

### Actions

| Action | Permission |
|--------|------------|
| **Create User** | Create |
| **View** | View |
| **Edit** | Edit |
| **Delete** | Delete |

---

## Create user (step-by-step)

1. Click **Create User**.
2. Complete the form:

| Field | Required | Rules |
|-------|----------|-------|
| Username | Yes | 3–50 characters; must be unique |
| Full Name | Yes | |
| Mobile Number | Yes | Exactly 10 digits |
| Email | No | Valid format if provided |
| Password | Yes | At least 6 characters |
| User Type | Yes | See table below |
| Active | — | Default: on |
| Permissions | No | Only if you have **manage permissions** |

3. Click **Save**.

### User types you can create

Supervisor, Chairman, Accountant, Collection Agent, Worker.

> **Important:** You **cannot** create **Admin** accounts through this form. Existing admins cannot have their user type changed here.

---

## Edit user

Same fields as create; **password** is optional—leave blank to keep the current password.

---

## View user (read-only)

Shows profile and **permission summary**:

- For **Admin**: message that admin receives all permissions.
- For others: list of permission overrides or role defaults.

**Edit** button appears if you have edit permission.

---

## Permission picker

If you have **manage permissions**:

1. Expand modules (Masters, Garage, Tickets, Application Access, etc.).
2. Check **view**, **create**, **edit**, **delete** (and special actions like **assign** where shown).
3. Save the user.

> Tickets permissions may be configured even if not shown in every picker view—admins should verify ticket access for workers.

---

## Voice app access

Sidebar link **Voice app access** opens an **external** site in a new tab (for voice-related user management). Requires **users** view permission.

---

## Tips

- Prefer **inactive** over delete when someone may return.
- Use **permission overrides** sparingly—role templates are easier to audit.
- Mobile number is required for operational contact—double-check digits.

---

## Related guides

- [Manage application users](../workflows/user-management.md)
- [Roles and permissions](../roles-and-permissions.md)
