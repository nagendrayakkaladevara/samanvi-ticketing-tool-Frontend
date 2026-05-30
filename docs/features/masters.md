# Masters

## Feature overview

**Masters** are reference lists used across tickets, garage, and operations. Keeping them accurate ensures dropdowns and reports stay correct.

### Areas

| Page | Purpose |
|------|---------|
| **Service For** | Types of service (used by Service No) |
| **Bus No** | Full bus registry + spare tanks |
| **Service No** | Routes: distance, stops, crew betas |
| **Employees** | Drivers, helpers, office staff |

You only see tabs and actions your permissions allow.

---

## Service For

**Path:** Masters → **Service For**

### What it does

Stores names for “service for” types linked to service numbers.

### Step-by-step: add a value

1. Open **Service For**.
2. Click **Add** (or Create).
3. Enter **Service For name** (required, max 120 characters).
4. Save.

### Actions

| Action | Permission |
|--------|------------|
| View list | View |
| Create | Create |
| Edit | Edit |
| Delete | Delete |
| Export Excel | View (where shown) |

---

## Bus No

**Path:** Masters → **Bus No**

Two tabs: **Normal buses** and **Spare tanks**.

### Normal buses — main fields

| Field | Required | Notes |
|-------|----------|-------|
| Bus Number | Yes | Fleet identifier |
| Engine Number | Yes | |
| Chassis Number | Yes | |
| Odometer (km) | Yes | |
| Insurance Validity | Yes | Date |
| Purchase Date | No | |
| Last Maintenance | No | |
| Pollution / FC / Permit dates | No | Compliance dates |
| Service Out Date | No | |
| Remarks | No | |

### Spare tanks

| Field | Required |
|-------|----------|
| Bus Number | Yes (max 50 chars) |
| Owner Name | Yes |

### Actions

- **Add / Edit / Delete** per tab permissions.
- **Export** Normal buses to Excel/PDF; Spare tanks to Excel/PDF.

> **Note:** This is the **full** bus record. A simpler **Buses** page exists for ticket linking—see [Buses](buses.md).

---

## Service No

**Path:** Masters → **Service No**

### What it does

Defines route/service numbers with distances, endpoints, and crew payment fields.

### Required fields (typical create form)

Service For, Service Number, Distance (km), From, To, Via, Parking Amount, Driver One Beta, Driver Two Beta, Helper Beta, Conductor Beta, Optional Driver, Optional Helper, Remarks.

### Step-by-step

1. Open **Service No**.
2. Click **Add**.
3. Select **Service For** and fill all required fields.
4. Save.
5. Use **View** on a row for read-only detail before editing.

---

## Employees

**Path:** Masters → **Employees**

Three tabs: **Driver**, **Helper**, **Office Staff**.

### Driver (key fields)

Required examples: Aadhar Name, DL Name, DOB, Mobile, Aadhar Number, DL Number/Issue/Expiry, transport dates, bank details, Date of Joining. Optional: photo, UPI, extra contact fields.

### Helper (key fields)

Required examples: Aadhar Name, Nick Name, DOB, Mobile, Aadhar Number, bank details, Date of Joining, Reference.

### Office Staff (key fields)

Required examples: Full Name, Nick Name, Designation, DOB, Mobile, Aadhar Number, bank details, Date of Joining, Reference Name.

### Actions per tab

**Add**, **View**, **Edit**, **Delete**—each tab checks **driver**, **helper**, or **office_staff** permissions separately.

---

## Tips

- Update **odometer** on buses when garage jobs report new readings.
- Deactivate or correct records instead of duplicating bus numbers.
- Complete bank and ID fields for payroll-related compliance.

---

## Related guides

- [Export data](../workflows/exporting-data.md)
- [Garage](garage.md)
- [Buses](buses.md)
