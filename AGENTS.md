# AI Agent Rules

Keep this file short. Use the plan docs for detail.

## Before Editing

- Read the relevant plan docs first:
  - `Docs/v11-split/00-INDEX.md`
  - `Docs/v11-split/01-core/`
  - `Docs/v11-split/02-modules/`
  - `Docs/v11-split/03-reference/`
  - `Docs/v11-split/04-roadmap/`
  - `Docs/v11-split/ERP_Master_Build_Plan_v11.md`
  - `Docs/v11-split/ERP_Master_Build_Plan_v10.md` only when needed
- Explain the implementation plan before editing files.
- If docs and code disagree, trust current code first and keep docs/checklists aligned.
- Follow existing architecture and naming. Do not create duplicate systems, helpers, UI patterns, or API logic.
- Update `Project Check List.md` after finishing a phase or step. Create it if missing.

## Source Of Truth

- Backend: Laravel 11 JSON API under `/api/v1`.
- Frontend: standalone Next.js/React app in `frontend/`.
- Live backend domains include Foundation, Contacts/Tax, Catalog, Inventory, Accounting, and Sales.
- Purchases, Expenses, Reports, Loyalty, CRM, Manufacturing, HRM, and other optional modules are roadmap unless current code proves otherwise.
- Permissions alone do not mean a module is implemented. Do not expose UI without real routes, controllers, services, and frontend support.

## Backend Rules

- Keep controllers thin; use Form Requests, Services, API Resources, and existing `BaseApiController` helpers.
- Use Repositories where the module already uses them.
- Preserve tenant isolation through `business_id` and existing tenant/global-scope patterns.
- Preserve branch access:
  - `super_admin` bypasses globally.
  - Tenant roles, including `admin` and `accountant`, must use assigned branch access.
  - Tenant users with no assigned branches get `403 No branch access assigned`.
- Keep authorization in middleware/controllers/policies, not primarily in services.
- Add or update tests when backend behavior changes.

## Frontend Rules

- Use Next.js App Router, React, TypeScript, MUI, React Query, Zustand, Axios wrappers, React Hook Form, Zod, and i18next.
- Read `frontend/AGENTS.md` before frontend work.
- Keep API transport in `frontend/src/api/*` or feature API files.
- Keep feature hooks, schemas, and UI in `frontend/src/features/*`.
- Keep shared types in `frontend/src/types/*`.
- Page components must not call Axios directly. Use React Query for server state.
- Reuse existing shared components for loading, empty states, row actions, confirmations, toasts, filters, selects, status displays, and branch-aware behavior.
- Before adding repeated UI or data-entry patterns, check for an existing reusable component or hook first. If the same pattern is needed in more than one place, create or extend a small typed shared component/hook instead of duplicating page-level code.
- Keep shared frontend components small, composable, option-driven, and aligned through the theme so one implementation can work across modules without copy/paste.
- Keep form controls, filter controls, and table actions on shared sizing/style standards; fix mismatches in the shared component or theme instead of one-off page overrides.
- Keep button styling consistent across the system: primary create/save/confirm actions use filled buttons, secondary navigation/cancel actions use outlined buttons, destructive actions use error styling, and table row view/edit/delete actions use the shared row action pattern.
- Keep button sizing consistent: primary page/header actions, form footer actions, and dialog actions use the default MUI button size; secondary page-header navigation such as Back uses a small icon-only `IconButton` with a tooltip; dense table inline actions and icon-only row controls use `size="small"`.
- New pages need loading, empty, validation, error, create, edit, and delete states where backend supports them.
- Sidebar/routes should expose only implemented frontend pages.

## Translation Rules

- Translate every new user-facing frontend string in both:
  - `frontend/src/i18n/en`
  - `frontend/src/i18n/km`
- Do not leave Khmer files with English placeholder text.
- Register new frontend namespaces in `frontend/src/i18n/index.tsx`.
- Add navigation and breadcrumb labels in both languages when adding routes.

## Done Means

- Existing patterns are followed and no duplicate system was introduced.
- Permission, tenant, and branch behavior remain consistent.
- Required frontend states and translations are complete.
- Verification was run where relevant:
  - Frontend: `npm.cmd run type-check`, `npm.cmd run lint`, and/or `npm.cmd run build`
  - Backend: focused PHPUnit/feature tests, or broader `php artisan test` when needed
- `Project Check List.md` is updated.

## Current Next Slice

- Catalog frontend rebuild completed Units and Price Groups.
- Continue with a live Catalog backend module that still needs frontend build, likely Variation Templates or Rack Locations.
- Inspect backend routes/controllers/resources/services first and reuse Categories, Brands, Units, and Price Groups frontend patterns.
