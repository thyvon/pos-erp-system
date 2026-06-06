## SECTION 13 - IMPLEMENTATION REFERENCE SUMMARY

### Backend Modules With Active Route Files

- Foundation
- Catalog
- Inventory
- Accounting
- Sales
- Purchases
- Expenses

### Module Foundation

- Module registry and per-business `business_modules` licensing/access gate are present.
- Current live module route groups are guarded by module middleware.
- Auth payloads include `enabled_modules` for frontend module-aware navigation.
- HRM remains the recommended first new standalone module.

### Frontend Areas With Active Views

- Auth
- Foundation
- Contacts and tax
- Catalog
- Inventory
- Accounting
- Sales
- Purchases
- Expenses

### Planned But Not Yet Built

- Reports
- Loyalty
- Commissions
- CRM
- Gift cards
- Manufacturing
- Assets
- Installments
- HRM
- Notifications

---

*End of Master Build Plan v11*
