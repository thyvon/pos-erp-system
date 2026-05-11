## SECTION 8 - API AND DATABASE ORGANIZATION

### 8.1 API Surface by Domain

Current route groups:

- auth
- foundation
- catalog
- inventory
- accounting
- sales

This grouping should remain the API organization baseline for v11 work.

### 8.2 Database Progress

Current migrations cover:

- foundation
- tax and contacts
- catalog
- inventory ledger and workflow tables
- accounting
- sales

Not yet migrated as first-class modules in this repo:

- purchases
- expenses
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

