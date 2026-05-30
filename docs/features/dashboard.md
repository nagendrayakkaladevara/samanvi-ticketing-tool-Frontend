# Dashboard

## Feature overview

The **Dashboard** gives managers and ticket teams a **snapshot** of ticket health: how many are open, overdue, unassigned, and how the team is performing.

### Why users use it

- Morning operational review.
- Spotting overdue or unassigned work quickly.
- Drilling into filtered lists by status or time period.

### When to use it

- Start of shift or week.
- Before escalation meetings.

**Permission needed:** View on **Tickets**.

---

## Opening the dashboard

1. Sign in.
2. Go to **Dashboard** (link from admin or direct URL `/dashboard`).

---

## Screen explanation

### Reporting period

| Control | Purpose |
|---------|---------|
| **Period dropdown** | Today, 1, 2, 6, 14, 30, 60, or 90 days |

All summary numbers respect the period you select.

### Summary cards

Typical cards include:

| Card | Meaning |
|------|---------|
| **Total** | Tickets in scope for the period |
| **Open** | Still active |
| **Unassigned** | No owner yet |
| **In Progress** | Being worked |
| **Closed / Resolved** | Completed in period |
| **Overdue** | Past SLA due date |

Cards may show a **trend** percentage compared to a prior window. **Click a card** to open a filtered ticket list (admins).

### Other panels

| Panel | Content |
|-------|---------|
| **Priority breakdown** | P1 / P2 / P3 distribution |
| **Open by status** | Count per status |
| **Severity** | Critical through Low |
| **Team performance** | Leaderboard: open assigned and resolved in window |

### Quick actions

| Action | Purpose |
|--------|---------|
| **Search ticket** | Jump to a ticket by 4-digit number |
| **Create Ticket** | New issue form |
| **View All Tickets** | Full ticket list |

---

## Step-by-step: morning review

1. Open **Dashboard**.
2. Set **reporting period** to **Today** or **7 days**.
3. Check **Overdue** and **Unassigned** cards first.
4. Click a card to open the filtered list (if you are admin).
5. Assign or update tickets from the list or details pages.

---

## Tips

- Set your default period in **Settings → Reporting period default** to save time.
- Pair dashboard review with the **Board** (admins) for drag-and-drop status updates.

---

## Related guides

- [Tickets](tickets.md)
- [Board](board.md)
- [Tickets by status (admin)](../roles-and-permissions.md)
