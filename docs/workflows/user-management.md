# Workflow: Manage application users

Onboard, update, and offboard Samanvi login accounts.

**Who:** Users with **Application Users** permissions (view/create/edit; manage_permissions for access changes).

---

## Create a new account

1. **Application Access** → **Create User**.
2. Enter **username** (3–50 chars)—wait for “available” if checker runs.
3. Enter **full name** and **10-digit mobile**.
4. Add **email** if used in your org.
5. Set a **password** (min 6 characters)—communicate securely per policy.
6. Choose **user type** (not Admin).
7. Leave **Active** on.
8. Set **permissions** if you have manage_permissions (or rely on role template).
9. **Save**.
10. Ask the user to sign in and confirm access.

---

## Change permissions

1. Open user → **Edit** (or create flow).
2. Expand permission tree.
3. Enable **view** at minimum for each module they need.
4. Add **create/edit/delete** only where required (principle of least access).
5. Save.
6. Ask user to **log out and back in** if menu does not update.

---

## Update profile or password

1. **Application Access** → find user → **Edit**.
2. Update name, mobile, email, or user type as allowed.
3. Enter **new password** only if resetting; blank keeps current password.
4. Save.

---

## Deactivate (recommended for leavers)

1. Edit user.
2. Turn **Active** off.
3. Save.

User cannot sign in but record remains for audit.

---

## Delete account

1. Only when policy allows permanent removal.
2. **Delete** from list or detail.
3. Confirm—usually irreversible.

Prefer **inactive** for former employees.

---

## Verify access

| Check | How |
|-------|-----|
| Can sign in | User tests login |
| Sees correct menu | Compare to permission table in [Roles guide](../roles-and-permissions.md) |
| Can complete one task | e.g. view ticket or create repair job |

---

## Admin accounts

- Cannot create new **Admin** via self-service form.
- Existing admins cannot change user type to non-admin in UI.
- Admins receive **all permissions** automatically.

---

## Related guides

- [Application Access](../features/application-access.md)
- [Legacy Users page](../features/users.md)
