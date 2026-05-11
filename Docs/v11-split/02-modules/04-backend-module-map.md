## SECTION 4 - MODULE MAP: BACKEND

### 4.1 Foundation Module

Implemented backend areas:

- Auth: login, logout, forgot password, reset password, preferences, `/auth/me`
- Super-admin business management
- Business profile
- Roles
- Users with many-to-many branch assignment and default branch
- Branches
- Warehouses
- Settings by group
- Custom field definitions

Key rules already present:

- User branch access is many-to-many through `branches()`
- `default_branch_id` exists on users
- Admin cannot assign branch-scoped access to another admin role
- Branch and warehouse deletion guardrails exist

### 4.2 Tax and Contacts

Implemented:

- Tax rates
- Tax groups
- Customer groups
- Customers
- Suppliers

This area is business-wide, not branch-scoped.

### 4.3 Catalog

Implemented:

- Categories
- Brands
- Units and sub-units
- Variation templates and values
- Rack locations
- Price groups
- Products
- Product variations
- Combo items
- Product packaging

The product area already supports more than the old foundation docs implied. The plan must treat it as live, not upcoming.

### 4.4 Inventory

Implemented:

- Stock movements and stock levels
- Stock adjustments
- Stock lots
- Stock serials
- Stock transfers with `pending -> in_transit -> received`
- Inventory product lookup
- Inventory options endpoint
- Stock counts with live count entries

Important current behaviors:

- Transfers reserve source stock while pending/in-transit
- Transfer receive consumes reservation and posts inbound movement
- Destination-side visibility behavior is supported in tests
- Serial write-off updates serial state and stock
- Count workflow exists, but some edit/remove/delta tests still need stabilization

### 4.5 Accounting

Implemented:

- Chart of accounts
- Journals
- Journal entries
- Payment accounts
- Account transactions
- Fiscal years

Important current behavior:

- Manual journals can be reversed
- Payment account transfers create transactions and audit logs
- Only one active fiscal year is allowed

### 4.6 Sales

Implemented:

- Sales
- Sale items
- Sale payments
- Sale returns
- Quotations
- Cash registers
- Cash register sessions

Important current behavior:

- Sale flow supports draft, quotation, suspended, confirmed, completed, cancelled, returned patterns
- Inventory reservation and completion are enforced through `StockMovementService`
- Accounting posting happens during completion
- Sale edit lifetime is controlled through settings
- Branch filtering is enforced in policy and data access

### 4.7 Deferred Backend Modules

These are **not implemented yet** and must stay in roadmap status:

- Purchases
- Expenses
- Reports
- Loyalty
- Commissions
- CRM
- Gift cards
- Manufacturing
- Asset management
- Installments
- Notifications
- HRM module logic

Do not generate code assuming these modules already have backend structure in this repo.

---

