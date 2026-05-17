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
- `super_admin` bypasses branch scope for platform administration.
- Tenant roles, including `admin` and `accountant`, use assigned branch access.
- A tenant user with zero assigned branches receives `403 No branch access assigned`.

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
