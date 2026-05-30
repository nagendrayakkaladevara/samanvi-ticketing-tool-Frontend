# Garage

## Feature overview

The **Garage** module tracks **bus repair jobs**: what was wrong, odometer reading, category, parts used, and job status from start to finish.

### Sub-areas

| Page | Purpose |
|------|---------|
| **Create Repair Job** | Log a new repair |
| **Repair Tracking** | List and open jobs |
| **Reports** | Garage reporting (may show “coming soon”) |
| **Garage Masters** | Repair categories and spare parts catalog |

**Permissions:** Separate view/create/edit/delete rights on **repair job**, **repair category**, and **repair part**.

---

## Repair job statuses

| Status | Meaning |
|--------|---------|
| **Created** | Logged, not yet assigned |
| **Assigned** | Given to office staff |
| **In progress** | Work underway |
| **On hold** | Paused |
| **Completed** | Work finished |
| **Cancelled** | Job stopped |
| **Closed** | May appear on records; not in all edit dropdowns |

**Priority:** Low, Medium, High, Urgent

---

## Create Repair Job

**Path:** Garage → **Create Repair Job**

### Step-by-step

1. Click **Create Repair Job** in the sidebar.
2. Fill in the form:

| Field | Required | Notes |
|-------|----------|-------|
| Bus Number | Yes | Select from master bus list |
| Odometer Reading (km) | Yes | Whole number, 0 or higher |
| Repair Category | Yes | Leaf category only (no parent-only picks) |
| Priority | Yes | Default: Medium |
| Description | Yes | What work is needed |
| Reported Driver | No | From drivers master |
| Assign To (Office Staff) | No | If set, status becomes **Assigned** |
| Created By | Read-only | Your account |

3. Click **Submit**.
4. You are redirected to **Repair Tracking** or job details.

**Permission:** Create on **repair job**.

---

## Repair Tracking (list)

**Path:** Garage → **Repair Tracking**

### Screen elements

| Element | Purpose |
|---------|---------|
| **Create Job** | New repair (if create allowed) |
| **Table** | Recent jobs (up to 50 shown) |
| **Columns** | Job ID, bus, category, priority, status, assignee, creator, odometer, repeat flag |
| **Row click** | Open job details |
| **Edit / Delete** | If your permissions allow |

---

## Job details

**Path:** Open a job from Repair Tracking

### Information shown

Job ID, bus, category, status, odometer, driver, assignee, creator, dates, repeat-job info, description, comments, spare parts with costs, activity timeline.

### Actions

| Action | Permission | Purpose |
|--------|------------|---------|
| **Edit Job** | Edit | Change status, category, assignee, etc. |
| **Add spare parts** | Edit | Attach parts from catalog |
| **Remove spare part** | Edit | Remove a line |
| **Schedule repeat job** | Edit | Plan follow-up (not on repeat jobs) |
| **Add comment** | Edit | Note up to 2000 characters |
| **Download PDF** | View | Save job report |
| **History** | View | Activity sheet |
| **Share** | View | Share job link |

**Bus number cannot be changed** after creation—only on the edit form header for reference.

---

## Edit job

**Path:** Job details → **Edit Job**

Editable: odometer, category, priority, status, description, driver, office staff assignee.

Statuses in dropdown: created, assigned, in progress, on hold, completed, cancelled.

---

## Garage Masters

**Path:** Garage → **Garage Masters**

### Tab: Repair Categories

- Hierarchical tree (parent/child categories).
- **Add / Edit / Delete** per your category permissions.
- Use **leaf** categories when creating jobs.

### Tab: Repair Parts

| Field | Required | Rules |
|-------|----------|-------|
| Part name | Yes | Max 120 characters |
| Price | Yes | Valid number |
| Description | No | Optional |

---

## Garage Reports

**Path:** Garage → **Reports**

Placeholder for future garage analytics. You need **view** on repair jobs to open the page.

---

## Tips

- Record **odometer** accurately for maintenance history.
- Add **parts** as work progresses so costs stay current.
- Use **repeat jobs** for scheduled follow-ups instead of manual re-entry.

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Picking parent category only | Select a **leaf** category |
| Wrong bus in masters | Update **Masters → Bus No** first |
| Expecting to change bus on edit | Create a new job if wrong bus |

---

## Related guides

- [Create a repair job](../workflows/creating-repair-job.md)
- [Manage repair jobs](../workflows/managing-repair-jobs.md)
- [Masters — Bus No](masters.md#bus-no)
