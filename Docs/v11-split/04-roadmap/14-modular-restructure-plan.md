# Modular Restructure Plan

This plan moves the project from one ERP product into a modular platform where clients can buy HRM alone, ERP modules alone, or any combined package.

The restructure must be gradual. Do not move all existing code at once. The first completed slice is the module foundation: `config/modules.php`, `business_modules`, `ModuleService`, `module:<key>` middleware, auth `enabled_modules`, and module-aware sidebar visibility.

## Target Architecture

```text
Core Platform
  Auth
  Tenancy / Businesses
  Users / Roles / Permissions
  Branches / Locations
  Settings
  Files
  Audit
  Module Registry
  Licensing

Standalone Modules
  HRM
  Sales
  Inventory
  Accounting
  Purchases
  Expenses
  Reports
  CRM
  Manufacturing
```

Core is always present. Every business module must be enableable, disableable, and sellable per business.

## Product Packaging Goal

Supported purchase examples:

```text
HR only:
  core + hrm

POS only:
  core + contacts + catalog + inventory + sales

ERP standard:
  core + contacts + catalog + inventory + sales + purchases + accounting + expenses

Full suite:
  core + all modules
```

## Non-Negotiable Rules

- Keep `core` independent and always enabled.
- HRM must not require Sales, Inventory, Purchases, or Accounting.
- Optional integrations must check module enablement before running.
- Permissions alone do not mean a module is purchased or implemented.
- Frontend route/sidebar visibility must require module enablement and permission.
- Backend route access must require auth, tenant, branch scope where relevant, module enablement, and permission/policy.
- Existing live modules must not be moved in one large restructure.

## Backend Destination Shape

Current live code can stay in existing folders until migration is safe. New standalone modules should use:

```text
Modules/HRM/
  module.json
  routes/api.php
  Database/Migrations/
  Models/
  Http/Controllers/
  Http/Requests/
  Http/Resources/
  Services/
  Repositories/
  Policies/
  Tests/
```

Core platform code should gradually collect shared platform services:

```text
app/Core/
  Auth/
  Tenancy/
  Modules/
  Licensing/
  Settings/
  Audit/
  Files/
```

## Frontend Destination Shape

Current feature folders can stay until migration is safe. New standalone modules should use:

```text
frontend/src/core/
  api/
  auth/
  layout/
  modules/
  permissions/

frontend/src/modules/hrm/
  api/
  hooks/
  schemas/
  types/
  components/
  pages/
```

Existing feature folders can migrate later:

```text
frontend/src/features/sales -> frontend/src/modules/sales
frontend/src/features/inventory -> frontend/src/modules/inventory
```

## Phase 1 - Module Foundation

Status: started.

Purpose: create the licensing/access foundation without moving live modules.

Deliverables:

- Backend module definitions in `config/modules.php`.
- `business_modules` table for per-business module access.
- `BusinessModule` model.
- `ModuleService`.
- `module:<key>` middleware.
- Current sellable route groups protected by module middleware.
- Auth payload includes `enabled_modules`.
- Frontend module registry exists.
- Sidebar hides disabled modules.
- Focused backend tests cover enabled modules and disabled module blocking.

Exit criteria:

- Existing tenants keep default access to current live modules.
- Disabling a module blocks its backend route group.
- Disabling a module hides its sidebar section/items.
- Auth and frontend verification pass.

## Phase 2 - Admin Module Management

Purpose: give super admin a UI/API to sell, enable, disable, trial, expire, and limit modules per business.

Backend deliverables:

- Super-admin module management API under `/api/v1/admin/businesses/{business}/modules`.
- Form requests for module status, dates, limits, and settings.
- API resources showing module definitions plus business state.
- Audit logs for enable, disable, trial, expire, and limit changes.
- Tests for super-admin-only access and business isolation.

Frontend deliverables:

- Business Management exposes a module management action/dialog, or a Modules tab if a detail page is introduced later.
- Module cards/table show status, dates, limits, and settings.
- Enable/disable/trial/expire actions.
- English and Khmer translations.

Exit criteria:

- Super admin can manage purchased modules without database editing.
- Tenant users cannot manage module licensing.
- Disabled modules disappear from tenant navigation after refresh.

## Phase 3 - HRM Standalone Module

Purpose: build HRM as the first clean standalone module.

Backend scope:

- Departments.
- Job positions.
- Employees.
- Employee documents.
- Employment contracts.
- Attendance foundation.
- Leave types and leave requests.
- Payroll draft foundation.

Frontend scope:

- HRM sidebar section.
- Employee list/detail/create/edit.
- Department and position setup.
- Leave request workflow.
- Attendance pages.
- Payroll draft pages when backend supports them.

Rules:

- HRM must work with only `core + hrm`.
- HRM may use branches/locations from core.
- HRM must not call accounting directly unless accounting is enabled.

Exit criteria:

- A business with only HRM enabled can use HR features.
- Sales, Inventory, Purchases, and Accounting can stay disabled.
- Backend and frontend tests pass for HRM-only access.

## Phase 4 - Optional Integration Layer

Purpose: connect modules without hard dependencies.

Pattern:

```text
HRM emits:
  PayrollRunApproved

Accounting listens only when accounting module is enabled:
  PostPayrollJournal
```

Deliverables:

- Module-aware event/listener registration or runtime guards.
- Integration services for HRM to Accounting.
- Integration tests for enabled and disabled accounting states.

Exit criteria:

- HRM payroll can exist without accounting.
- When accounting is enabled, approved payroll can post journals.
- When accounting is disabled, no accounting tables are required for HRM workflows.

## Phase 5 - Reports and Dashboard Modularization

Purpose: make dashboards and reports assemble from enabled modules.

Deliverables:

- Report registry per module.
- Dashboard widgets registered by module.
- Frontend only shows widgets/reports for enabled modules and permissions.
- Tests for hidden reports when modules are disabled.

Exit criteria:

- HR-only tenant sees HR dashboard/report surfaces only.
- ERP tenant sees ERP surfaces according to enabled modules.

## Phase 6 - Gradual Existing Module Migration

Purpose: move existing modules to the new structure only after the pattern is proven.

Recommended order:

1. Expenses.
2. Purchases.
3. Sales.
4. Inventory.
5. Accounting.
6. Catalog.
7. Contacts.
8. Core cleanup.

Migration rules:

- Move one module at a time.
- Keep API URLs stable.
- Keep permissions stable unless explicitly planned.
- Keep tests passing before starting the next module.
- Do not mix migration with feature expansion.

Exit criteria per module:

- Routes load from module folder.
- Controllers, requests, resources, services, repositories, policies, tests are grouped.
- Frontend feature code moves to `frontend/src/modules/<module>`.
- Navigation and breadcrumbs still work.
- Type-check, lint, build, and focused backend tests pass.

## Phase 7 - Marketplace and Package Model

Purpose: define sellable plans and module bundles.

Example packages:

```text
HR Starter:
  core + hrm
  employee limit: 25

HR Pro:
  core + hrm
  employee limit: 200
  payroll: enabled

POS Basic:
  core + contacts + catalog + inventory + sales

ERP Standard:
  core + contacts + catalog + inventory + sales + purchases + accounting + expenses
```

Deliverables:

- Package definitions.
- Package-to-module provisioning.
- Limits stored in `business_modules.limits`.
- Billing/subscription integration later.

Exit criteria:

- New business creation can provision modules from a package.
- Module limits are enforced by services or validators.

## Phase 8 - Final Platform Cleanup

Purpose: make the codebase clearly express platform + modules.

Deliverables:

- Shared core namespace cleaned up.
- Module documentation generated or maintained.
- Old duplicate helpers removed.
- Permission/module docs aligned.
- CI verifies module access, branch scope, and frontend build.

Exit criteria:

- New modules can be added by following one standard template.
- Existing modules no longer depend on hidden cross-module coupling.
- Product packages are enforceable from backend to frontend.

## HRM First-Slice Recommendation

Start HRM with the smallest useful standalone workflow:

1. Department setup.
2. Job position setup.
3. Employee CRUD.
4. Employee documents.
5. Leave type setup.
6. Leave request workflow.

Payroll and accounting integration should come after HRM employee/leave foundations are stable.
