## SECTION 5 - MODULE MAP: FRONTEND

### 5.1 Live Frontend Areas

The active frontend has been restacked to Next.js/React. Current implemented frontend areas cover:

- Login and auth state persistence
- Dashboard shell
- Protected dashboard layout, sidebar, topbar, breadcrumbs, account popover, settings panel, and notification popover shell
- No-branch-access blocking page
- Foundation, contacts/tax, catalog, inventory, accounting, and Sales list/detail/create/edit frontend slices

The backend APIs for foundation, contacts, catalog, inventory, accounting, and sales are live. Purchases has a backend document foundation only; purchase frontend pages are still pending and should not be exposed until implemented.

### 5.2 Frontend Architecture Rules

- `frontend/src/api/*` should contain transport logic only
- `frontend/src/features/*` should contain feature hooks, schemas, and module-specific client logic
- `frontend/src/stores/*` own persistent local UI/auth state through Zustand
- server data should flow through shared API wrappers and React Query hooks, not inline Axios inside page components
- route pages should stay thin; feature lists, filters, forms, detail sections, action dialogs, and line-item tables should live as focused typed components
- large feature logic should be split into API wrappers, hooks, schemas, helper/payload builders, and presentational components before it becomes hard to maintain
- Next.js layouts/components enforce login, permission checks, super-admin-only routes, and branch-access blocking
- sidebar visibility is permission-driven
- translations must exist in both `en` and `km`

### 5.3 Current Branch-Aware UI Rules

- Non-admin users use `allowed_branches` from auth payload
- Admin and super-admin load unrestricted branch lists when needed
- Users with zero branches are redirected to `/no-branch-access`
- Sales, inventory, and future purchase flows filter branch and warehouse choices accordingly

---
