# Troubleshooting guide

Simple fixes for common Samanvi problems. If none of these work, contact your **administrator** or **internal support**.

---

## Cannot sign in

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| “Invalid username or password” | Wrong credentials or inactive account | Retry carefully; ask admin to verify account and reset password |
| Username too short error | Fewer than 3 characters | Use full username provided by admin |
| Password too short error | Fewer than 8 characters | Enter full password |
| Page reloads to login | Session expired | Sign in again |
| Blank screen after login | No permissions for any home route | Admin must grant at least one module view |

**When to contact support:** Account should be active but login still fails after password reset.

---

## Missing menu or “Access denied”

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| No Tickets/Garage/Masters | Missing view permission | Request permissions; log out and back in |
| Board not visible | Not Admin role | Use ticket list; request admin if board needed |
| Application Access missing | No users::view | Admin grants Application Users view |
| Redirect to Home from URL | Route blocked by role or permission | Check [Roles and permissions](../roles-and-permissions.md) |

**When to contact support:** Permissions were updated but menu unchanged after re-login.

---

## Form will not save

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| “Please fill all required fields” | Empty required field | Look for red errors; complete Required badges |
| Username taken | Duplicate username | Choose another username |
| Mobile invalid | Not 10 digits | Enter exactly 10 digits, no spaces |
| Bus/category not found | Master data missing | Add in Masters or Garage Masters first |
| Odometer error | Negative or decimal | Enter whole km ≥ 0 |

**When to contact support:** All fields correct but server error persists.

---

## Ticket workflow issues

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| Cannot update status | Viewer or no update_status permission | Request permission or ask supervisor |
| Cannot assign | Worker role or no assign permission | Supervisor assigns |
| Reopened not available | Ticket not Closed | Close first, then reopen |
| Resolved rejected | Missing note | Enter resolution description |
| Cannot drag on board | Created/Blocked columns or invalid transition | Use Resolved before Closed |
| Search finds nothing | Wrong format | Use 4-digit number only |

**When to contact support:** Status rules block valid process—may need admin rule change.

---

## Garage issues

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| No buses in dropdown | Bus not in Masters → Bus No | Add bus in masters |
| Cannot pick category | Parent-only category | Select leaf category |
| Cannot add parts | No edit permission | Request repair_job edit |
| PDF download fails | Browser block | Allow downloads; try another browser |

---

## Data not visible

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| Ticket list empty | Filters or no view permission | Clear filters; confirm permission |
| Repair list shows 50 only | Design limit | Use search or filters if available |
| Dashboard shows zero | Wrong reporting period | Change period dropdown |
| Profile won’t load | Network or server error | Settings → Retry |

---

## Performance and display

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| Slow loading | Network or large export | Retry; export smaller sets |
| Sidebar stuck on mobile | Menu open | Tap outside or navigate to close |
| Theme wrong | Local setting | Settings → Appearance |
| List out of date | Auto-refresh off | Enable in Settings or refresh browser |

---

## Print and export

| Symptom | Possible cause | What to do |
|---------|----------------|------------|
| Print layout cut off | Browser print settings | Use landscape; scale to fit |
| Excel won’t open | Wrong app | Use Excel or Google Sheets |
| No export button | Permission | Request view on that master |

---

## When to contact support

Contact your **internal IT or Samanvi support** when:

- Multiple users cannot sign in at the same time.
- Data disappeared after a save that reported success.
- You see a repeated error ID or “server error” message.
- Permissions are correct on paper but access still fails after re-login.

**Include when reporting:**

- Your **username** (not password).
- **Screen** you were on (e.g. Create Ticket).
- **Time** of the problem.
- **Screenshot** if allowed by policy.
- Exact **error message** text.

---

## Related guides

- [FAQ](../faq/README.md)
- [Best practices](../best-practices/README.md)
