# Tickets

## Feature overview

**Tickets** are records of fleet issues—breakdowns, defects, delays, or anything that needs follow-up.

### What it does

- Lists all tickets you are allowed to see.
- Lets you **search** by ticket number, **create** new tickets, **open** details, and **share** links.
- Highlights tickets that are **past their due date** (SLA).

### Why users use it

- Central place to see what is open and who owns each issue.
- Starting point before creating or updating work.

### When to use it

- Daily standups or shift handovers.
- When you need to find a ticket by number.
- Before creating a new issue (to avoid duplicates).

**Permission needed:** View access on **Tickets**.

---

## Opening the ticket list

1. Sign in to Samanvi.
2. Go to **Tickets** (sidebar or direct link from your admin).
3. The list loads with columns such as ticket number, title, bus, assignee, due date, and severity.

---

## Screen explanation

### Header and actions

| Control | Action |
|---------|--------|
| **Create Ticket** | Opens the new ticket form (if you have create permission) |
| **Search** | Find a ticket by **4-digit ticket number** (digits only) |

### Table / grid

| Column | Meaning |
|--------|---------|
| **Ticket #** | Unique number for the issue |
| **Title** | Short summary |
| **Bus** | Bus number linked to the issue |
| **Created By** | Who logged the ticket |
| **Assigned To** | Who is responsible (may be empty) |
| **Due Date (SLA)** | When the issue should be resolved by |
| **Severity** | How serious: Critical, High, Medium, Low |

- **Sort** and **filter** using column headers (desktop grid).
- On **mobile**, tickets appear as **cards** with the same information.

### Row actions

| Action | Purpose |
|--------|---------|
| **Open** | Go to ticket details |
| **Share** | Copy or share a link to this ticket |
| **Delete** | Remove ticket (**Admin or Supervisor only**) |

> **Warning:** Delete is permanent. Use only when a ticket was created by mistake and your process allows it.

---

## Search by ticket number

1. In the search box, enter the **4-digit** ticket number.
2. Press Enter or use the search action.
3. If the number is invalid (not 4 digits), you will see an error.
4. If valid, matching tickets appear or you are taken to the result.

---

## Create a ticket (summary)

Full steps: [Create a ticket workflow](../workflows/creating-a-ticket.md).

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Short summary |
| Description | Yes | Full details; AI enhance needs at least 4 words |
| Severity | Yes | Critical / High / Medium / Low |
| Priority | Yes | P1 urgent, P2 default, P3 planned |
| Category | Yes | Pick from list |
| Bus Number | Yes | Choose from master buses |
| Assign To | No | Optional at create |
| SLA Due At | Yes | Use **Suggest SLA** for P1 +4h, P2 +12h, P3 +24h |
| Created By | Read-only | Your account |

---

## Ticket statuses (list view)

Statuses appear as labels on each row. Common values:

| Status | Meaning |
|--------|---------|
| **Created** | New, not yet assigned |
| **Assigned** | Someone owns it |
| **In Progress** | Work underway |
| **Blocked** | Waiting on something |
| **Resolved** | Fix done; note often required |
| **Closed** | Finished |
| **Reopened** | Opened again after close |

---

## Important notes

- The list may **auto-refresh** based on your Settings preference.
- **Overdue** SLA dates are visually highlighted—prioritize those first.
- You need **create** permission to see **Create Ticket**.

---

## Common mistakes

| Mistake | Better approach |
|---------|-----------------|
| Searching with letters | Use only the 4-digit number |
| Creating duplicate tickets | Search first by bus and title |
| Expecting delete as a worker | Only Admin/Supervisor can delete |

---

## Related guides

- [Ticket details](ticket-details.md)
- [Create a ticket](../workflows/creating-a-ticket.md)
- [Dashboard](dashboard.md)
