## SECTION 8 - API AND DATABASE ORGANIZATION

### 8.1 API Surface by Domain

Current route groups:

- auth
- foundation
- catalog
- inventory
- accounting
- sales
- purchases
- expenses

This grouping should remain the API organization baseline for v11 work. Sellable module route groups should also be protected with `module:<key>` middleware when the route belongs to a module that can be licensed independently.

### 8.2 Database Progress

Current migrations cover:

- foundation
- tax and contacts
- catalog
- inventory ledger and workflow tables
- accounting
- sales
- purchases
- expenses
- module licensing through `business_modules`

Not yet migrated as first-class modules in this repo:

- reporting stores
- loyalty
- CRM
- HRM
- manufacturing
- asset management

### 8.3 Data Modeling Rules

- Ledger-style movement tables are authoritative for stock and accounting history
- Business ownership must be explicit on tenant-bound records
- Branch ownership must be explicit on branch-scoped records
- Workflow header tables and ledger tables must not be confused with each other

---
