## SECTION 1 - CURRENT DELIVERY STATUS

### 1.1 What Is Actually Built

The current repository has working backend, frontend, migrations, policies, and tests for these areas:

- Authentication and tenant bootstrap
- Business, branches, warehouses, users, roles, settings, and custom fields
- Tax rates, tax groups, customer groups, customers, and suppliers
- Catalog: categories, brands, units, variation templates, rack locations, price groups, and products
- Inventory: adjustments, lots, serials, stock transfers, stock counts, inventory lookup, and inventory options
- Accounting: chart of accounts, journals, payment accounts, and fiscal years
- Sales: sales, quotations, cash registers, payments, POS-related frontend flows, and sale returns

### 1.2 What Is Present Only as Permission or Planning Surface

These areas exist in permissions, old plans, or placeholders, but are **not fully implemented in the current codebase**:

- Purchases
- Expenses
- Reports and dashboards beyond the current dashboard shell
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
| Catalog | Live | Product flow is implemented with variations and packaging |
| Inventory | Live but still stabilizing | Core workflows exist; some count edge-case tests still fail |
| Accounting | Live | Manual journals, payment accounts, fiscal years implemented |
| Sales | Live | Sales, quotations, registers, payments, returns implemented |
| Purchases | Planned | Permissions reserved, no active module yet |
| Optional Modules | Planned | Not implemented yet |

### 1.4 Important Deltas From v10

The codebase differs from older v10 planning in important ways:

- `admin` and `super_admin` both bypass branch scope globally.
- `accountant` bypasses branch-assignment blocking only for accounting routes.
- `AuditService` currently writes directly to `audit_logs` inside a guarded `try/catch`; it is **not queue-dispatched** yet.
- `BaseRepository` is a thin CRUD abstraction; Redis caching is **not implemented** there yet.
- There is no shared `Auditable` trait in the current codebase.
- The frontend stack is currently smaller than the earlier plan: Vue 3, Pinia 3, Vue Router 4, Axios, VeeValidate, Yup, Tailwind, Font Awesome, Vue i18n.
- Purchases, reports, loyalty, CRM, manufacturing, HRM, and other later modules are still roadmap items, not current implementation.

---

