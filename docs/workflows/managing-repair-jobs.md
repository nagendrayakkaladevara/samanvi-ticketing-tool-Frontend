# Workflow: Manage repair jobs

Track a repair from assignment through completion, including parts and repeat scheduling.

---

## Overview

| Phase | Status | Main actions |
|-------|--------|--------------|
| Logged | Created | Edit, assign, comment |
| Owned | Assigned | Start work → In progress |
| Working | In progress | Add parts, comments |
| Paused | On hold | Resume when ready |
| Done | Completed | PDF, history |
| Stopped | Cancelled | No further work |

---

## Step 1: Find the job

1. **Garage** → **Repair Tracking**.
2. Click the job row or job ID.
3. Review bus, odometer, category, and current status.

---

## Step 2: Assign or reassign

1. Click **Edit Job** (or edit from list if available).
2. Set **Assign To (Office Staff)**.
3. Set status to **Assigned** if not already.
4. Save.

---

## Step 3: Work in progress

1. Open job details.
2. **Edit Job** → status **In progress**.
3. **Add comment** for shift notes (max 2000 characters).
4. **Add spare parts**:
   - Choose part from catalog.
   - Enter quantity (defaults may apply).
   - Save; totals update on the job.

---

## Step 4: On hold (if needed)

1. Edit job → status **On hold**.
2. Add comment explaining why (parts delay, vendor, etc.).

---

## Step 5: Complete

1. Edit job → status **Completed**.
2. Verify all parts are recorded.
3. **Download PDF** for records if required.

---

## Step 6: Schedule repeat job (optional)

For follow-up maintenance:

1. On job details (not already a repeat child), use **Schedule repeat job**.
2. Set the future date per dialog instructions.
3. Save.

Repeat jobs link to the previous job for traceability.

---

## Remove a spare part

1. On job details, find the part line.
2. Use **Remove** (requires edit permission).
3. Confirm.

---

## Cancel a job

1. Edit job → status **Cancelled**.
2. Add comment with reason.

Use when work will not be done on this job record.

---

## Share and history

| Action | Use |
|--------|-----|
| **Share** | Send link to supervisor |
| **History** | View full activity sheet |
| **Download PDF** | Offline copy for files |

---

## Permissions reminder

| Action | Need |
|--------|------|
| View job | repair_job → view |
| Edit, parts, comments | repair_job → edit |
| Delete job | repair_job → delete (if shown) |

---

## Related guides

- [Create repair job](creating-repair-job.md)
- [Garage Masters](../features/garage.md#garage-masters)
