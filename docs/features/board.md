# Board (Kanban)

## Feature overview

The **Board** shows tickets as **cards in columns** by status—like a Kanban board. Admins can **drag cards** between columns to update status.

### Why users use it

- Visual workflow management.
- Quick status changes during standups.

### When to use it

- When you need to see all active tickets by stage at once.
- When dragging status is faster than opening each ticket.

**Access:** **Admin role only** (not permission-based alone).

---

## Opening the board

1. Sign in as an **Admin**.
2. Go to **Board** (`/board`).

---

## Columns

| Column | Typical content |
|--------|-----------------|
| **Created** | New tickets |
| **Assigned** | Owned but not started |
| **In Progress** | Active work |
| **Resolved** | Fixed, pending close |
| **Closed** | Done |
| **Reopened** | Back from closed |

**Blocked** tickets may appear in lists but **Created** and **Blocked** columns do not accept drops from drag-and-drop.

---

## Step-by-step: move a ticket

1. Find the ticket **card** in its current column.
2. **Drag** the card to the target column.
3. If prompted, enter a **note** (required when moving to **Resolved**).
4. Confirm.

### Card actions

| Action | Purpose |
|--------|---------|
| **Click title** | Open ticket details |
| **Share** | Share ticket link |

---

## Rules (same as ticket details)

- Cannot drag **In Progress** directly to **Closed**—use **Resolved** first.
- **Reopened** only from **Closed**.

---

## Tips

- Use the board for overview; use **ticket details** for long comments or assignment changes.
- Refresh the page if cards look out of date after others make changes.

---

## Related guides

- [Manage ticket status](../workflows/managing-ticket-status.md)
- [Dashboard](dashboard.md)
