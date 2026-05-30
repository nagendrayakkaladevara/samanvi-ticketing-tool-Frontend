# Ticket details

## Feature overview

The **ticket details** page shows everything about one issue: description, bus, SLA, assignment, status, timeline, and actions.

### When to use it

- After opening a ticket from the list, dashboard, or board.
- When updating status, reassigning, or adding comments.

**Permission needed:** View on **Tickets**; separate permissions for assign and update status.

---

## Screen explanation

### Information shown

| Section | Content |
|---------|---------|
| **Header** | Ticket number, title, current status |
| **Details** | Priority, severity, category, bus, SLA due date, created/updated times |
| **People** | Created by, assigned to |
| **Description** | Full issue text |
| **QR code** | Quick reference (where shown) |
| **Timeline** | History of status changes, assignments, and comments |

### Main actions

| Button / action | Who can use it | Purpose |
|-----------------|----------------|---------|
| **Update status** | Roles with update permission | Change lifecycle status |
| **Update assignment** | Admin/Supervisor + assign permission | Change owner |
| **Add comment** | Admin, Supervisor, Worker | Add notes to timeline |
| **Share** | Users with view access | Share link |
| **Print** | Users with view access | Print ticket report |

**Viewers** can read but cannot change status, assign, or comment.

---

## Update status (step-by-step)

1. Open the ticket.
2. Click **Update status** (or similar).
3. Choose the **new status** from the list.
4. If moving to **Resolved**, enter a **note** (required).
5. Confirm.

### Status rules to remember

| Rule | Detail |
|------|--------|
| **In Progress → Closed** | Not allowed; move to **Resolved** first |
| **Reopened** | Only from **Closed** |
| **Resolved** | Requires a description/note |

### Who can set which status

| Role | Typical allowed targets |
|------|-------------------------|
| **Admin / Supervisor** | Assigned, In Progress, Resolved, Closed; Reopened from Closed |
| **Worker** | In Progress, Resolved, Closed (not assign) |
| **Viewer** | None |

---

## Update assignment (step-by-step)

1. Click **Update assignment**.
2. Select a user from the list.
3. Optionally add an **assignment note**.
4. Save.

Requires **assign** permission and Admin/Supervisor role for full assignment control.

---

## Add a comment

1. Find the comment area on the details page.
2. Type your note.
3. Submit.

Comments appear on the **timeline** with your name and time.

---

## Print and share

- **Share** — copies a link others can open (they must have login and view rights).
- **Print** — opens a printable layout for meetings or records.

---

## Tips

- Always add a clear note when resolving—helps the next shift.
- Check **SLA due date** before changing priority elsewhere.
- Use the timeline to see what already happened before reassigning.

---

## Related guides

- [Manage ticket status](../workflows/managing-ticket-status.md)
- [Tickets list](tickets.md)
- [Board](board.md)
