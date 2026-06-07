## SECTION 4 - MODULE MAP: BACKEND

### 4.0 Module Foundation

Implemented:

- `config/modules.php` defines sellable module keys and default-enabled behavior
- `business_modules` stores per-business active/trial/expired/disabled module access, limits, and settings
- `ModuleService` resolves enabled modules for auth responses and route middleware
- `module:<key>` middleware gates current module route groups

This is a licensing/access foundation only. Existing live code still lives in the current `app/Http`, `app/Services`, `app/Repositories`, and route domain folders. Build HRM as the first clean standalone module before migrating existing live modules.

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
- Stock levels can be browsed by product and warehouse with branch-scoped visibility

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

### 4.7 Purchases

Implemented:

- Purchases
- Purchase items
- Purchase document list/create/show/update/delete API
- Purchase receiving API
- Purchase payments with correction/deletion reversal journals
- Purchase returns

Important current behavior:

- Purchase documents are branch-scoped through `branch_id`
- Purchase creation validates supplier, branch, warehouse, products, and variation ownership
- Warehouse must belong to the selected branch
- Purchase totals are calculated in `PurchaseService`
- Purchase receiving posts `purchase_receipt` stock movements and updates received quantities
- Lot-tracked receiving creates or updates stock lots
- Serial-tracked receiving creates stock serials
- Purchase payments post accounting journals and payment-account transactions
- Purchase payment correction/deletion reverses ledger history instead of hard-deleting it
- Purchase returns post outbound stock movements, preserve branch access, support multiple return documents, and do not write unsupported purchase status values
- Purchase receipt and purchase return AP/inventory accounting journals remain a stabilization target and should be implemented together; supplier credit/refund handling is a separate future feature

### 4.8 Reports

Partially implemented:

- Sales report API at `/api/v1/reports/sales`
- Sales Return report API at `/api/v1/reports/sales-returns`
- Purchases report API at `/api/v1/reports/purchases`
- Purchase Return report API at `/api/v1/reports/purchase-returns`
- Sale Payments report API at `/api/v1/reports/sale-payments`
- Purchase Payments report API at `/api/v1/reports/purchase-payments`
- Reports route group is gated by the `reports` module and `reports.index` permission
- Sales report supports search, status, type, payment status, branch, warehouse, customer, and date filters
- Sales Return report supports search, status, refund method, branch, warehouse, customer, and date filters
- Purchases report supports search, status, payment status, branch, warehouse, supplier, and date filters
- Purchase Return report supports search, status, branch, warehouse, supplier, and date filters
- Sale Payments report supports search, status, method, branch, warehouse, customer, payment account, cashier, and date filters
- Purchase Payments report supports search, status, method, branch, warehouse, supplier, payment account, cashier, and date filters
- Sales, Sales Return, Purchases, Purchase Return, Sale Payments, and Purchase Payments reports return summary totals, paginated rows, and branch-scoped visibility through the current branch-scope model behavior

Still roadmap:

- Report exports
- Report registry
- Financial reports
- Inventory, purchases, expenses, tax, cash register, ledger, and dashboard report slices

### 4.9 Deferred Backend Modules

These are **not implemented yet** and must stay in roadmap status:

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
