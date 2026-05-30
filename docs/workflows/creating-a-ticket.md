# Workflow: Create a ticket

End-to-end steps to log a new fleet issue.

**Who:** Users with **Tickets → create** permission (often Supervisors and Admins).

**Time:** About 3–5 minutes.

---

## Before you start

- [ ] Confirm the issue is not already logged (search ticket list by bus or number).
- [ ] Know the **bus number**.
- [ ] Know **severity** and **priority** per your company rules.

---

## Steps

### 1. Open the create form

1. Sign in to Samanvi.
2. Go to **Tickets**.
3. Click **Create Ticket**.

### 2. Enter issue details

1. **Title** — Short summary (e.g. “AC not cooling on Route 12”).
2. **Description** — What happened, when, and impact.
   - Optional: click **Enhance description with AI** after typing at least **4 words**.
3. **Severity** — Critical / High / Medium / Low.
4. **Priority** — P1 (urgent), P2 (default), P3 (planned).
5. **Category** — Select the closest issue type.

### 3. Link the bus

1. In **Bus Number**, start typing or select from the list.
2. Only buses from **master data** appear.

### 4. Set due date (SLA)

1. Open **SLA Due At** (date and time).
2. Click **Suggest SLA** if available—uses P1 +4 hours, P2 +12 hours, P3 +24 hours from now.
3. Adjust if your process requires a different deadline.

### 5. Assign (optional)

1. In **Assign To**, pick a worker or supervisor—or leave empty.
2. If you assign at create time, the ticket may be created and assigned in one step.

### 6. Submit

1. Review **Created By** (your name).
2. Click **Submit**.
3. Wait for success message.
4. You return to the **Tickets** list; open the new ticket to verify.

---

## Expected outcome

- New ticket with status **Created** (or **Assigned** if you assigned someone).
- Ticket appears in list and on Dashboard counts.
- Assignee receives notification if your organization has notifications enabled.

---

## Validation errors

| Message | Fix |
|---------|-----|
| Required field | Fill every field marked required |
| AI enhance needs 4 words | Add more to description first |
| Invalid bus | Pick a bus from the list; add bus in Masters if missing |

---

## After creation

- [ ] Notify assignee if not auto-notified.
- [ ] Add comment on details page if handoff notes are needed.
- [ ] Track on [Dashboard](../features/dashboard.md) if overdue.

---

## Related guides

- [Manage ticket status](managing-ticket-status.md)
- [Tickets feature](../features/tickets.md)
