## SECTION 1 - CURRENT DELIVERY STATUS

### 1.1 What Is Actually Built

The current repository has working backend, migrations, policies, and tests for these areas. The frontend has been switched from the older Vue plan to a new Next.js/React stack and should be rebuilt module by module against these live backend APIs:

- Authentication and tenant bootstrap
- Business, branches, warehouses, users, roles, settings, and custom fields
- Tax rates, tax groups, customer groups, customers, and suppliers
- Catalog: categories, brands, units, variation templates, rack locations, price groups, and products
- Inventory: adjustments, lots, serials, stock transfers, stock counts, inventory lookup, and inventory options
- Accounting: chart of accounts, journals, payment accounts, and fiscal years
- Sales: sales, quotations, cash registers, payments, POS-related frontend flows, and sale returns
- Purchases: purchases, purchase payments, purchase returns
- Expenses: expense recording with accounting integration
- Reports first slices: module-gated Sales, Sales Return, Purchases, Purchase Return, and Sale Payments report APIs and frontend page with filters, totals, pagination, and branch-scoped visibility

### 1.2 What Is Present Only as Permission or Planning Surface

These areas exist in permissions, old plans, or placeholders, but are **not fully implemented in the current codebase**:

- Reports beyond Sales/Sales Returns/Purchases/Purchase Returns/Sale Payments, report exports, financial reports, and dashboards beyond the current dashboard shell
- Loyalty
- Commissions and sales targets
- CRM
- Gift cards
- Manufacturing
- Asset management
- Installments
- Notifications and scheduled jobs beyond framework capability
- HRM module beyond placeholder folders in `Modules/HRM`

### 1.3 Current State Classification

| Area | State | Notes |
|---|---|---|
| Foundation | Live | End-to-end backend/frontend/tests exist |
| Contacts and Tax | Live | CRUD and policy coverage exist |
| Catalog | Live | Product flow is implemented with variations and combo items |
| Inventory | Live | Core workflows and stock-level browsing exist |
| Accounting | Live | Manual journals, payment accounts, fiscal years implemented |
| Sales | Live | Sales, quotations, registers, payments, returns implemented |
| Purchases | Live | Purchases, payments, returns implemented |
| Expenses | Live | Expense recording with accounting integration |
| Reports | Partial | Sales, Sales Return, Purchases, Purchase Return, and Sale Payments report API/frontend slices are live behind the Reports module gate |
| Optional Modules | Planned | Not implemented yet |

### 1.4 Important Deltas From v10

The codebase differs from older v10 planning in important ways:

- `super_admin` bypasses branch scope for platform administration.
- Tenant roles, including `admin` and `accountant`, require assigned branch access.
- `AuditService` currently writes directly to `audit_logs` inside a guarded `try/catch`; it is **not queue-dispatched** yet.
- `BaseRepository` is a thin CRUD abstraction; Redis caching is **not implemented** there yet.
- There is no shared `Auditable` trait in the current codebase.
- The frontend stack has changed from the earlier Vue plan to Next.js, React, TypeScript, MUI, React Query, Zustand, Axios, React Hook Form, Zod, and i18next.
- Broader reports, report exports, dashboards, loyalty, CRM, manufacturing, HRM, and other later modules are still roadmap items, not current implementation.

---
