# Workflow: Create a repair job

Log a new garage repair from start to finish.

**Who:** Users with **Garage → repair job → create**.

---

## Before you start

- [ ] Bus exists in **Masters → Bus No** (garage uses master bus list).
- [ ] Know current **odometer (km)**.
- [ ] Know **repair category** (leaf level in Garage Masters).

---

## Steps

### 1. Open create form

1. Sidebar → **Garage** → **Create Repair Job**.

### 2. Enter job details

| Step | Field | Action |
|------|-------|--------|
| 1 | Bus Number | Select bus |
| 2 | Odometer Reading | Enter whole km reading |
| 3 | Repair Category | Pick leaf category |
| 4 | Priority | Low / Medium / High / Urgent |
| 5 | Description | Describe work needed |
| 6 | Reported Driver | Optional |
| 7 | Assign To (Office Staff) | Optional—sets status to **Assigned** if filled |

### 3. Submit

1. Check **Created By**.
2. Click **Submit**.
3. Success → job appears in **Repair Tracking**.

---

## Expected outcome

- New job with status **Created** or **Assigned**.
- Job ID visible in list and details.
- Team can add parts and comments on details page.

---

## Next steps

- [ ] Notify assigned office staff.
- [ ] Update status to **In progress** when work starts.
- [ ] Add spare parts as used.
- [ ] Mark **Completed** when done.

See [Manage repair jobs](managing-repair-jobs.md).

---

## Common issues

| Issue | Resolution |
|-------|------------|
| Bus not in list | Add bus in Masters → Bus No |
| Category missing | Add leaf category in Garage Masters |
| Cannot submit | Fill all required fields; odometer must be ≥ 0 |

---

## Related guides

- [Garage feature](../features/garage.md)
