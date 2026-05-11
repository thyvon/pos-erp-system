## SECTION 5 - MODULE MAP: FRONTEND

### 5.1 Live Frontend Areas

Implemented frontend pages and stores cover:

- Login, forgot password, reset password
- Dashboard shell
- Businesses admin page
- Users and roles
- Branches and warehouses
- Settings
- Tax rates and tax groups
- Customer groups, customers, suppliers
- Catalog pages for products, categories, brands, units, variation templates, rack locations, price groups
- Inventory pages for adjustments, transfers, counts, lots, serials
- Accounting pages for chart of accounts, journals, payment accounts, fiscal years
- Sales pages for sales, sale form, POS, quotations, cash registers, sale returns
- No-branch-access blocking page

### 5.2 Frontend Architecture Rules

- `frontend/src/api/*` should contain transport logic only
- `frontend/src/stores/*` own state and async actions
- page views should call store actions, not inline Axios
- route guards enforce login, permission checks, super-admin-only routes, and branch-access blocking
- sidebar visibility is permission-driven
- translations must exist in both `en` and `km`

### 5.3 Current Branch-Aware UI Rules

- Non-admin users use `allowed_branches` from auth payload
- Admin and super-admin load unrestricted branch lists when needed
- Users with zero branches are redirected to `/no-branch-access`
- Sales and inventory flows filter branch and warehouse choices accordingly

---

