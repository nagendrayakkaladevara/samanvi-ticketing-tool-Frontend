# Best practices

Recommended ways to work in Samanvi for accuracy, speed, and security.

---

## Tickets

### Data entry

- Write **clear titles**—someone should understand the issue without opening the ticket.
- Use **severity** and **priority** consistently with your team’s definitions.
- Always set a realistic **SLA due date**; use **Suggest SLA** as a starting point.
- Pick the correct **bus number** from the list—do not typo manually if autocomplete is available.

### Workflow

- **Assign** tickets as soon as ownership is known.
- Move to **In Progress** when work actually starts.
- Use **Blocked** with a comment explaining what you are waiting for.
- Add a **detailed note** when moving to **Resolved**.
- Do not skip **Resolved** before **Closed**.

### Collaboration

- Use **comments** for updates that are not status changes.
- **Share** ticket links in official channels only—not public social media.
- Search by ticket number before creating duplicates.

---

## Garage

- Record **odometer** at job creation and update on edit if it changed significantly.
- Add **spare parts** as they are used, not only at job end.
- Choose the most specific **leaf** repair category.
- Use **on hold** instead of leaving jobs **in progress** when waiting days for parts.
- Schedule **repeat jobs** for preventive work instead of ad-hoc reminders.

---

## Masters

- Keep **bus compliance dates** (insurance, permits) current in **Bus No**.
- One bus number = one record—avoid duplicates.
- Review **employee** bank and ID fields when onboarding crew.
- Export masters **monthly** for backup if your policy requires it.

---

## Application Access and security

- Give users the **minimum permissions** they need.
- **Deactivate** accounts the same day someone leaves.
- Never share passwords; use admin reset instead.
- Admins should periodically review **permission overrides**.
- Log out on **shared devices**.

---

## Dashboard and reporting

- Start shifts with the same **reporting period** (e.g. Today) for consistent standups.
- Tackle **overdue** and **unassigned** cards before lower-priority work.
- Use **User History** (admins) for coaching, not punishment—focus on patterns.

---

## Productivity tips

| Tip | Benefit |
|-----|---------|
| Set **reporting period default** in Settings | Saves clicks on Dashboard |
| Enable sensible **auto-refresh** on tickets | Fewer manual reloads |
| Use **dark theme** on night shifts | Less eye strain |
| Install **PWA** on mobile | Faster access in yard/garage |
| Bookmark **Repair Tracking** or **Tickets** | One tap to daily work |

---

## Common mistakes to avoid

| Avoid | Do instead |
|-------|------------|
| Closing without resolution note | Always document fix in Resolved |
| Creating ticket without bus | Select bus from master list |
| Full admin for everyone | Role-based least access |
| Deleting tickets to “clean up” | Use status Closed; delete only mistakes per policy |
| Two bus master records for same bus | Merge/correct in Bus No |

---

## Related guides

- [Workflows](../workflows/creating-a-ticket.md)
- [Roles and permissions](../roles-and-permissions.md)
- [Glossary](../glossary.md)
