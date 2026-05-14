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
