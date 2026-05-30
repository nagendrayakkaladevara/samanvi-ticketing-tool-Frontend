# Buses (ticket fleet list)

## Feature overview

The **Buses** page is a **simple list of buses** used when linking tickets to a vehicle. It is separate from the detailed **Masters → Bus No** registry.

### Why users use it

- Quick bus setup for ticketing.
- View **all tickets** ever logged against one bus.

### When to use it

- Adding a bus that appears in ticket dropdowns.
- Investigating repeat issues on the same vehicle.

**Access:** **Admin** or **Supervisor** role.

---

## Buses list

**Path:** `/buses` (admin/supervisor link)

### Screen elements

| Element | Purpose |
|---------|---------|
| **Create bus** | Add a new bus number |
| **Table** | Bus number, last maintenance |
| **Row click** | Open ticket history for that bus |

---

## Create bus (step-by-step)

1. Click **Create bus**.
2. Enter **Bus Number** (required).
3. Optionally set **Last Maintenance Date**.
4. Save.

---

## Bus ticket history

**Path:** Click a bus row → `/buses/:busId/tickets`

| Action | Purpose |
|--------|---------|
| **Back to Buses** | Return to list |
| **Open ticket** | Ticket details |
| **Share** | Share ticket link |

Shows every ticket recorded for that bus.

---

## Buses vs Masters → Bus No

| | **Buses** (this page) | **Masters → Bus No** |
|--|----------------------|----------------------|
| **Purpose** | Ticket linking | Full compliance & garage data |
| **Fields** | Bus number, last maintenance | Engine, chassis, permits, odometer, etc. |
| **Who** | Admin, Supervisor | Permission-based |

Garage **Create Repair Job** uses **master bus numbers**, not this simple list.

---

## Related guides

- [Tickets](tickets.md)
- [Masters — Bus No](masters.md#bus-no)
