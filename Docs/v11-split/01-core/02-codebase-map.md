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

- `frontend/src/api/` - Axios request wrappers only
- `frontend/src/stores/` - Pinia state and async actions
- `frontend/src/router/` - route definitions and auth/permission guards
- `frontend/src/navigation/` - sidebar generation
- `frontend/src/views/` - page-level Vue views
- `frontend/src/components/` - reusable UI and feature components
- `frontend/src/i18n/` - translation structure for `en` and `km`

### 2.4 Test Structure

Implemented features are backed mainly by Feature tests under:

- `tests/Feature/Api/V1/`
- `tests/Feature/Inventory/`

This is meaningful because the new plan must distinguish:

- implemented and tested
- implemented but failing tests
- planned but not built

---

