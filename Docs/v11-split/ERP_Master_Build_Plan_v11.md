# ERP System - Master Build Plan v11
**Laravel 11 REST API - Next.js React Frontend - MariaDB - Sanctum - Spatie Permission**

**Version:** 11.0  
**Date:** 2026-05-11  
**Purpose:** Canonical project document for AI-assisted development in this repository.  
**Scope:** This document describes the system as it exists in the current codebase, the rules AI agents must follow, and the organized roadmap for what comes next.

---

## SECTION 0 - HOW TO USE THIS DOCUMENT

This document replaces older plan versions as the primary source of truth for work inside this repository.

- Treat this file as **codebase-aligned**, not wishlist-first.
- If code and older plans disagree, prefer the code and update this document.
- Never describe a module as implemented unless it has code in routes, controllers, services, frontend views, and supporting models/migrations.
- Use the roadmap section for future work. Do not mix future requirements into current-state sections.
- When adding a feature, update the relevant plan section in the same task if the behavior or architecture changes.

Reading order for an AI agent:

1. Section 1 - Delivery Status
2. Section 2 - Codebase Map
3. Section 3 - Architecture Rules
4. Section 6 - Security, Authorization, and Branch Scope
5. Section 10 - Agent Delivery Workflow
6. Section 11 - Roadmap

---

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
| Catalog | Live | Product flow is implemented with variations and combo items |
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
- The frontend stack has changed from the earlier Vue plan to Next.js, React, TypeScript, MUI, React Query, Zustand, Axios, React Hook Form, Zod, and i18next.
- Purchases, reports, loyalty, CRM, manufacturing, HRM, and other later modules are still roadmap items, not current implementation.

---

## SECTION 2 - CODEBASE MAP

### 2.1 Backend Structure

- `app/Http/Controllers/Api/V1/`
  - `Admin/`
  - `Auth/`
  - `Foundation/`
  - `Catalog/`
  - `Inventory/`
  - `Accounting/`
  - `Sales/`
- `app/Services/`
  - `Admin/`
  - `Auth/`
  - `Foundation/`
  - `Catalog/`
  - `Inventory/`
  - `Accounting/`
  - `Sales/`
- `app/Repositories/`
  - Same domain grouping as services for implemented modules
- `app/Http/Requests/`
  - Form Requests are used across implemented modules
- `app/Http/Resources/`
  - API Resources exist for implemented modules
- `app/Policies/`
  - Policy coverage exists for all implemented modules
- `app/Traits/`
  - `HasUuid`, `BelongsToTenant`, `BelongsToBranch`, `HasUserTracking`, file/soft-delete helpers

### 2.2 Routes

Primary API entrypoints:

- `routes/api.php`
- `routes/v1/catalog.php`
- `routes/v1/inventory.php`
- `routes/v1/accounting.php`
- `routes/v1/sales.php`

### 2.3 Frontend Structure

- `frontend/src/app/` - Next.js App Router pages and layouts
- `frontend/src/api/` - Axios instance, request wrappers, API error handling, and React Query client setup
- `frontend/src/features/` - feature-scoped API hooks, schemas, and UI logic
- `frontend/src/stores/` - Zustand state for auth and UI preferences
- `frontend/src/components/` - reusable MUI-based UI, auth, and layout components
- `frontend/src/theme/` - MUI theme, palette, layout constants, and font presets
- `frontend/src/i18n/` - i18next translation structure for `en` and `km`
- `frontend/src/types/` - shared TypeScript API/domain types

### 2.4 Test Structure

Implemented features are backed mainly by Feature tests under:

- `tests/Feature/Api/V1/`
- `tests/Feature/Inventory/`

This is meaningful because the new plan must distinguish:

- implemented and tested
- implemented but failing tests
- planned but not built

---

## SECTION 3 - ARCHITECTURE RULES AS IMPLEMENTED

### 3.1 Application Style

The system is a Laravel 11 JSON API with a standalone Next.js React frontend inside `/frontend`.

- Backend returns JSON only for API routes.
- Frontend uses Next.js App Router, client components where needed, React Query for server state, Zustand for local app state, and MUI for UI.
- API versioning is currently centered on `/api/v1`.

### 3.2 Request Flow

The intended request path in current code is:

1. Route middleware
2. Controller authorization
3. Form Request validation
4. Service orchestration
5. Repository and model persistence
6. API Resource response
7. Audit write for important state changes

### 3.3 Tenant Scope

- `TenantResolver` loads the current business into `app('tenant')`.
- `BelongsToTenant` is the first protection layer for business isolation.
- `super_admin` bypasses tenant binding behavior where appropriate.

### 3.4 Branch Scope

- `BranchScopeMiddleware` sets `app('branch_scope')`.
- `BelongsToBranch` applies `whereIn(branch_id, allowedIds)` globally for branch-scoped models.
- `admin` and `super_admin` bypass branch scope.
- `accountant` may bypass branch-assignment blocking for accounting endpoints only.
- A non-bypass user with zero assigned branches receives `403 No branch access assigned`.

### 3.5 Authorization Model

Authorization is implemented at multiple layers:

- Permission middleware on routes
- Policy checks inside controllers via `$this->authorize(...)`
- Role and permission data from Spatie Permission
- Explicit branch access checks inside policies and some services

Services should not become the primary authorization layer. Some services still include safety checks tied to warehouse and branch access, but controller-policy authorization remains the intended main rule.

### 3.6 Response Contract

The shared API response helpers are in `BaseApiController`:

- `success(data, message, status)`
- `paginated(paginator, resource, extra)`
- `error(message, status, errors)`

Standard shapes:

- success single: `{ success: true, message, data }`
- success paginated: `{ success: true, data, meta }`
- failure: `{ success: false, message, errors? }`

### 3.7 Resource and Validation Pattern

Current implemented modules generally follow this pattern correctly:

- Form Requests validate input
- Controllers stay thin
- Services own business logic
- Resources define output shape

This pattern should remain the default for all new work.

---

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

## SECTION 5 - MODULE MAP: FRONTEND

### 5.1 Live Frontend Areas

The active frontend has been restacked to Next.js/React. Current implemented frontend areas cover:

- Login and auth state persistence
- Dashboard shell
- Protected dashboard layout, sidebar, topbar, breadcrumbs, account popover, settings panel, and notification popover shell
- No-branch-access blocking page

The backend APIs for foundation, contacts, catalog, inventory, accounting, and sales are live, but their Next.js frontend pages/forms must be rebuilt module by module.

### 5.2 Frontend Architecture Rules

- `frontend/src/api/*` should contain transport logic only
- `frontend/src/features/*` should contain feature hooks, schemas, and module-specific client logic
- `frontend/src/stores/*` own persistent local UI/auth state through Zustand
- server data should flow through shared API wrappers and React Query hooks, not inline Axios inside page components
- Next.js layouts/components enforce login, permission checks, super-admin-only routes, and branch-access blocking
- sidebar visibility is permission-driven
- translations must exist in both `en` and `km`

### 5.3 Current Branch-Aware UI Rules

- Non-admin users use `allowed_branches` from auth payload
- Admin and super-admin load unrestricted branch lists when needed
- Users with zero branches are redirected to `/no-branch-access`
- Sales and inventory flows filter branch and warehouse choices accordingly

---

## SECTION 6 - SECURITY, AUTHORIZATION, AND BRANCH SCOPE

### 6.1 Roles Currently Used in Code

- `super_admin`
- `admin`
- `manager`
- `cashier`
- `accountant`
- `inventory_manager`
- `sales_representative`

### 6.2 Permission Reality

The permission seeder includes permissions for both implemented and future modules. That means:

- permissions are not proof of implementation
- UI navigation and docs must only expose modules that actually exist
- future modules may keep reserved permission names for compatibility

### 6.3 Branch Scope Rules

Current branch behavior must be documented exactly:

- `super_admin`: global bypass
- `admin`: business-wide branch bypass
- `accountant`: still branch-aware generally, but not blocked from accounting routes when unassigned
- other non-bypass roles: must have at least one assigned branch to use the app

### 6.4 Policy Expectations

For implemented modules:

- every controller action should authorize before service execution
- policies should enforce same-business checks
- branch-scoped records should also enforce `hasBranchAccess(record.branch_id)` where relevant

### 6.5 Sensitive Data Rules

- passwords and tokens must never be returned accidentally
- audit payloads must sanitize password/token-like keys
- all API failures must stay JSON-shaped for API routes

---

## SECTION 7 - AUDIT AND TRACEABILITY

### 7.1 Current Audit Reality

`AuditService` exists and is actively used by implemented modules. It currently:

- writes directly to `audit_logs`
- catches exceptions and reports them
- sanitizes sensitive payload keys
- resolves tenant and branch context when possible

### 7.2 Important Current Audit Coverage

Observed audit coverage includes:

- login
- login_failed
- logout
- password_changed
- password_reset
- user lifecycle events
- payment account transfer
- inventory write-off
- sale creation and other sales lifecycle events

### 7.3 Planned Improvement

The older plan expected queue-dispatched audit writes. That is still a valid future improvement, but it is **not current reality**. Until it is implemented:

- document audit as synchronous-but-guarded
- do not claim `AuditLogJob` is active

---

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

## SECTION 9 - KNOWN GAPS AND STABILIZATION TARGETS

### 9.1 Test Snapshot

Local `php artisan test` was run on **2026-05-11**.

Observed PHPUnit summary before the shell timeout:

- 122 passing tests
- 23 failing tests

### 9.2 Main Failure Themes

The failures indicate real stabilization work still needed in the current implementation:

- some older tests do not yet match newer branch-scope rules
- some catalog/contact tests assume permissions or branch behavior that changed
- stock count edit/remove/delta workflows still need correction
- a serial movement invariant test is failing
- a few tests create duplicate temporary tables inside the test itself

### 9.3 What This Means for Planning

The next phase should be **stabilize the current live modules**, not immediately start new large modules.

---

## SECTION 10 - AI AGENT DELIVERY WORKFLOW

When an AI agent works in this repository, follow this order:

1. Read the relevant route file
2. Read the controller, Form Request, service, repository, resource, and policy for that feature
3. Check the frontend API file, store, router entry, sidebar entry, and page/component usage
4. Check existing tests for that module before changing behavior
5. Implement backend and frontend changes together when the feature spans both
6. Add or update tests in the same task
7. Update this plan if system behavior changed

Required implementation standards:

- use Form Requests for validation
- use API Resources for output
- keep controllers thin
- keep business logic in services
- keep frontend HTTP calls in `frontend/src/api`
- keep page views driven by feature hooks, shared API wrappers, React Query, and Zustand stores where appropriate
- add `en` and `km` translation keys in the same task

Forbidden assumptions:

- do not assume future modules already exist because permissions exist
- do not assume Redis caching exists in repositories
- do not assume audit is queued
- do not assume HRM is implemented because the module folder exists

---

## SECTION 11 - ORGANIZED ROADMAP FROM THE CURRENT BASELINE

### Phase 1 - Stabilize Current Implemented Modules

This is the immediate priority.

- fix failing branch-scope-related tests
- fix stock count edit/remove/completion delta behavior
- fix serial quantity invariant behavior
- align older tests with current branch-access rules where the code is correct
- remove test-only schema collisions

### Phase 2 - Close Architectural Gaps in Live Modules

- decide whether to introduce queued audit writes
- decide whether repositories should gain shared caching behavior
- standardize audit event naming across inventory and sales services
- review policies for consistency with route middleware
- review current frontend views for direct logic duplication

### Phase 3 - Finish the Commercial Core

Recommended next business modules after stabilization:

1. Purchases
2. Expenses and broader payment flows
3. Reports
4. Dashboard enrichment

This order is practical because purchases complete the stock lifecycle, and reports should come after both sales and purchases are stable.

### Phase 4 - Add Growth Modules

After core ERP operations are stable:

- loyalty
- commissions and targets
- CRM
- gift cards
- installments

### Phase 5 - Add Advanced Operational Modules

Only after the commercial core is stable:

- manufacturing
- asset management
- HRM
- notifications and scheduled automation

---

## SECTION 12 - ABSOLUTE RULES FOR v11

1. Codebase truth beats older plan text.
2. Do not mark a module as implemented unless routes, controllers, services, frontend pages, and supporting persistence all exist.
3. New features must follow the existing route -> request -> service -> resource pattern.
4. Controllers must authorize before calling services.
5. Tenant isolation is non-negotiable.
6. Branch scope rules must match the current middleware and policy behavior exactly.
7. Services may contain safety checks, but policies remain the primary authorization contract.
8. Audit writes must never leak passwords, tokens, or secrets.
9. Frontend pages must use stores and shared API wrappers, not ad hoc HTTP calls.
10. Translation keys for `en` and `km` must be updated in the same task as UI changes.
11. Tests are part of feature completion.
12. Stabilize live modules before expanding deep into planned modules.

---

## SECTION 13 - IMPLEMENTATION REFERENCE SUMMARY

### Backend Modules With Active Route Files

- Foundation
- Catalog
- Inventory
- Accounting
- Sales

### Frontend Areas With Active Views

- Auth
- Foundation
- Contacts and tax
- Catalog
- Inventory
- Accounting
- Sales

### Planned But Not Yet Built

- Purchases
- Expenses
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
