# ERP System — Master Build Plan v10
**Laravel 11 REST API · Vue 3 SPA · Tailwind CSS · MariaDB 10.11**

**Version:** 10.0 (2026)
**Purpose:** Single source of truth for AI-assisted development (Codex). Requirements only — no code.

**Changelog v10 from v9:**
- Added Section 2.6 — Branch Data Filter Layer (branch_users pivot table, BranchScopeMiddleware, multi-branch access per user)
- Added Section 2.7 — Audit Layer (AuditService, Auditable trait, complete audit event catalogue)
- Added branch_users pivot table — admin assigns one or many branches to any user
- Removed users.branch_id single-column approach — replaced by branch_users many-to-many
- Added BranchScopeMiddleware — loads array of allowed branch IDs into app('branch_scope')
- Users with no branch_users rows are blocked (403) until admin assigns at least one branch
- admin always bypasses branch filtering — accountant follows assigned branch access
- Branch filter uses WHERE branch_id IN (...) not WHERE branch_id = single value
- Stock transfer special rule: warehouse dropdowns show all business warehouses, but list is filtered to user's allowed branches
- When creating records, user selects branch from dropdown showing only their allowed branches
- List pages show merged data from all allowed branches with a branch filter dropdown
- Upgraded audit_logs table definition with branch_id column for full traceability
- Added audit event rules to every feature in Section 4 (what gets logged and when)
- Added AuditLogPage and AuditLogViewer to the frontend (admin/manager only)
- Added Phase 2 requirements: BranchScopeMiddleware, AuditService, Auditable trait
- Updated Golden Order to include audit call in the Service step
- Added 3 new absolute rules (Rules 29, 30, 31) covering branch scope and auditing
- Added Section 13 — Complete Audit Event Reference
- Updated competitive advantage table to include branch scoping and audit trail

---

## HOW TO USE THIS DOCUMENT

This is the single source of truth for building the ERP system. Written for Codex to read before generating any code.

- Read the relevant section fully before writing code for any feature
- Follow the build order in Section 10 exactly — dependencies are strictly ordered
- Every decision here is intentional — do not deviate without explicit instruction
- NEVER and ALWAYS are absolute — no exceptions
- Section 4 defines what the system must enforce — business rules are not optional
- Section 3 defines column names and types — they are final
- Section 2.5 defines the authorization architecture — follow it for every single controller
- Section 2.6 defines branch scoping — follow it for every repository query
- Section 2.7 defines the audit layer — every important event must call AuditService

---

## SECTION 1 — PROJECT OVERVIEW

### What This System Is

A multi-tenant retail ERP system sold commercially to small and medium businesses. One installation serves many businesses simultaneously. Each business is completely isolated. The system manages the complete business lifecycle: catalog, inventory (with lot and serial tracking), purchasing, POS sales, invoicing, recurring sales, double-entry accounting, expenses, loyalty, CRM, HR, assets, manufacturing, and 30+ reports.

### Competitive Advantage Over Ultimate POS

| Area | Ultimate POS | This System |
|---|---|---|
| Architecture | Monolithic Blade + jQuery | 100% REST API + Vue 3 SPA |
| Stock tracking | Basic expiry only | Full lot lifecycle + serial number per unit |
| Accounting | Paid add-on, retrofitted | Built-in double-entry, auto-posts every transaction |
| Data integrity | Direct DB updates allowed | Append-only ledgers for stock, accounting, loyalty, audit |
| Security | Basic roles, integer IDs | UUID keys, BelongsToTenant scope, Policies, rate limiting |
| Branch access | No branch isolation | User locked to branch — cannot see other branches' data |
| Audit trail | No audit log | Every important action recorded with who, what, when, where |
| API | Optional paid module | First-class, fully versioned, Swagger documented |
| Frontend | Server-rendered, slow | Full SPA, instant navigation |
| i18n | Translation-ready | Vue i18n architecture, locale per business |

### System Roles

| Role | Access Summary |
|---|---|
| super_admin | Platform-wide. Not tenant-scoped. Full access everywhere. Always sees all branches. |
| admin | Full access to own business. Always sees all branches. Cannot delete self or last admin. |
| manager | Most features. Sees only branches assigned via branch_users. Cannot edit COA or system settings. |
| cashier | POS and own-shift reports only. Sees only branches assigned via branch_users. Max discount enforced. |
| accountant | Journals, COA, payments, financial reports only. Uses assigned branch access via branch_users unless a module is explicitly business-wide. |
| inventory_manager | Inventory, products, purchases. Sees only branches assigned via branch_users. |
| sales_representative | Sales creation and own commission report only. Sees only branches assigned via branch_users. |

### Core Design Philosophy

**Everything is a ledger.** Stock changes, accounting entries, loyalty points, and audit events are written as new rows — never edited. Corrections create reversing entries.

**All data is tenant-scoped first.** BelongsToTenant trait adds WHERE business_id = app('tenant')->id to every Eloquent query automatically.

**Branch-scoped second.** BranchScopeMiddleware loads the user's allowed branch IDs from branch_users into app('branch_scope'). All qualifying queries automatically filter to WHERE branch_id IN (allowed ids). admin is never branch-restricted; accountant follows assigned branch access unless a module explicitly bypasses branch scope.

**Every important action is audited.** AuditService writes to audit_logs on every create, update, delete, state change, login, payment, and stock movement. No important event is silent.

**Services own all business logic.** Controllers receive, validate, call services, return API Resources. Services call AuditService at the end of every important operation.

**Authorization is enforced at two layers.** Route middleware checks permission strings. Controller Policy checks enforce complex rules. Services never check authorization.

**Modules extend, never modify core.** Optional modules add features without touching any file in app/.

---

## SECTION 2 — ARCHITECTURE

### 2.1 Backend — Laravel 11 REST API

Lives in the Laravel root. Exposes /api/v1/. Returns JSON only. Has no knowledge of the frontend.

### 2.2 Frontend — Vue 3 SPA

Lives in /frontend/ inside the Laravel project. Compiled to /public/build/ for production. Served by a single Laravel catch-all web route returning the one Blade SPA entry point.

### 2.3 API Versioning

All endpoints under /api/v1/. Non-breaking additions (new optional fields) can go to v1. Breaking changes (removing/renaming fields, changing types) require /api/v2/ and v1 must remain functional for 12 months after v2 launches.

### 2.4 Backend Layer Structure

| Layer | Location | Contents |
|---|---|---|
| Foundation | app/ | Auth, Users, Business, Branches, Warehouses, Settings |
| Configuration | app/ | Tax Rates, Tax Groups |
| Contacts | app/ | Customers, Customer Groups, Suppliers, Custom Fields |
| Catalog | app/ | Products, Variations, Brands, Categories, Units, Price Groups, Rack Locations |
| Inventory | app/ | Stock Movements, Levels, Lots, Serials, Counts, Adjustments, Transfers |
| Sales | app/ | Sales, POS, Quotations, Returns, Cash Register, Recurring Sales, Delivery |
| Purchases | app/ | Purchase Orders, Receives, Returns |
| Accounting | app/ | Chart of Accounts, Journals, Payment Accounts |
| Payments | app/ | Sale Payments, Purchase Payments |
| Expenses | app/ | Expenses, Expense Categories |
| Loyalty | app/ | Reward Points, Redemption |
| Commission | app/ | Sales Representatives, Commission Tracking, Sales Targets |
| Notifications | app/ | Email, SMS, and in-app alerts |
| Reports | app/ | Dashboard and all 30 reports |
| HRM | Modules/HRM/ | Employees, Attendance, Leave, Payroll |
| Installment | Modules/Installment/ | Installment plans and loan schedules |
| CRM | Modules/CRM/ | Leads, Follow-ups, Contact portal login |
| GiftCard | Modules/GiftCard/ | Gift cards and coupon codes |
| Manufacturing | Modules/Manufacturing/ | Production recipes and assembly runs |
| AssetManagement | Modules/AssetManagement/ | Company asset tracking and maintenance |

**Architecture rule:** Everything in app/ unless a business can operate completely without it. Modules extend without modifying core files.

### 2.5 Authorization Architecture — CRITICAL

This section defines exactly how authorization works throughout the entire system. Every developer and AI assistant must follow this exactly.

#### The Three-Wall Model

Every API request passes through three walls before reaching the Service:

```
HTTP Request
     ↓
Wall 1 — Route Middleware
  auth:sanctum          → Is the user logged in?
  can:users.create      → Does this role have this permission string?
     ↓
Wall 2 — Controller Policy
  $this->authorize('create', User::class)
  → Runs UserPolicy::create() for complex rules
     ↓
Wall 3 — Branch Scope (automatic, via BranchScopeMiddleware)
  Loads allowed branch IDs from branch_users into app('branch_scope')
  Adds WHERE branch_id IN (allowed_ids) to all qualifying queries
  → User with no assigned branches gets 403 blocked
  → admin bypasses this wall entirely
     ↓
Form Request Validation
  → Is the input data valid?
     ↓
Service
  → Business logic only. Zero auth knowledge. Calls AuditService on completion.
```

#### Layer Responsibilities

| Layer | Question It Answers | Implementation |
|---|---|---|
| Route middleware `auth:sanctum` | Is the user authenticated? | Laravel Sanctum |
| Route middleware `can:permission` | Does the role have this permission? | Spatie Permission |
| Controller `$this->authorize()` | Do complex rules allow this action? | Laravel Policy |
| BranchScopeMiddleware | Is this user allowed to access this branch's data? | branch_users pivot table lookup |
| Form Request | Is the input data valid? | FormRequest class |
| Service | How do we execute this business logic? | Service class |
| AuditService | Record what happened and who did it | Called from Service at completion |
| Repository | How do we query the database? | Repository class |

#### Where Authorization Lives

```
✅ Route middleware   — permission string check (first wall)
✅ Controller         — Policy check via $this->authorize() (second wall)
✅ Repository         — BranchScope applied automatically via middleware binding (third wall)
❌ Service            — NEVER checks auth or branch. Services are auth-blind.
❌ Model              — NEVER checks auth. Models are auth-blind.
```

#### Policy Naming Convention

Every resource model has exactly one Policy class.

All Policies registered in `app/Providers/AuthServiceProvider.php` (core) or the Module's ServiceProvider (modules).

#### Standard Policy Methods

Every Policy implements these standard methods:

```
viewAny($authUser)              — Can this user see the list page?
view($authUser, $model)         — Can this user view one record?
create($authUser)               — Can this user create a new record?
update($authUser, $model)       — Can this user edit this record?
delete($authUser, $model)       — Can this user delete this record?
```

Additional action-specific methods are added per resource (e.g. `confirm`, `complete`, `cancel` for SalePolicy).

#### How super_admin Bypasses All Policies

In `app/Providers/AuthServiceProvider.php`, define a Gate::before check:

```
Gate::before(function ($user, $ability) {
    if ($user->hasRole('super_admin')) {
        return true;
    }
});
```

#### Frontend Authorization

The Vue frontend uses `authStore.can('permission.string')` to show or hide buttons and menu items. This is purely cosmetic — it improves UX but provides zero security. The backend Policy is the only real security layer.

---

### 2.6 Branch Data Filter Layer — CRITICAL

This section defines how branch-level data access works. Every developer and AI assistant must follow this for every feature that has a branch_id column.

#### Why Branch Scoping Exists

A business may have multiple branches: Head Office, Branch A, Branch B. Without branch scoping:
- A cashier at Branch A can see Branch B's sales and stock.
- A manager at Branch A can edit Branch B's data.
- Reports show data from all branches mixed together with no way to control it.

Branch scoping ensures every user sees only data from the branches they are allowed to access. This is controlled by an admin per user, and enforced automatically on every query.

#### The branch_users Pivot Table

Branch access is a many-to-many relationship. One user can be assigned to many branches. One branch can have many users. This is stored in the `branch_users` pivot table (defined in Group A of the schema).

```
branch_users
  id
  business_id  (FK → businesses, INDEX)
  branch_id    (FK → branches, INDEX)
  user_id      (FK → users, INDEX)
  created_at
  Unique: (user_id, branch_id)
```

Admin manages branch access on the user edit page — a checklist of all branches in the business.

#### Access Rules

| User type | branch_users rows | Result |
|---|---|---|
| super_admin | ignored — always bypass | Sees all branches, no filter |
| admin | ignored — always bypass | Sees all branches, no filter |
| accountant | assigned rows apply | Sees only assigned branches in branch-scoped modules |
| Other role, has rows | e.g. Branch A + Branch B | Sees only Branch A and Branch B data merged |
| Other role, no rows | none | **403 Forbidden** — blocked until admin assigns at least one branch |

The bypass for admin is enforced in BranchScopeMiddleware by checking the user's role before doing any branch lookup.

#### BranchScopeMiddleware

`app/Http/Middleware/BranchScopeMiddleware.php` runs on every authenticated API request, **after TenantResolver**.

Logic:
1. If user is super_admin or admin → set `app('branch_scope')` = null (no filter)
2. Else load the user's branch IDs from branch_users → `['uuid-a', 'uuid-b']`
3. If the array is empty → abort 403 with message "No branch access assigned. Contact your administrator."
4. Else set `app('branch_scope')` = array of allowed branch IDs

```
Middleware order on every authenticated API request:
1. auth:sanctum          — authentication
2. TenantResolver        — sets app('tenant') = the user's business
3. BranchScopeMiddleware — sets app('branch_scope') = array of branch IDs, or null, or aborts 403
```

BranchScopeMiddleware must run after TenantResolver. It must run before any controller is reached.

#### BelongsToBranch Trait

`app/Traits/BelongsToBranch.php` is applied to models that have a `branch_id` column.

The trait adds a global Eloquent scope:
- If `app('branch_scope')` is null → no filter added (admin sees everything)
- If `app('branch_scope')` is an array → adds `WHERE branch_id IN (array)` to every query

This is automatic. No controller or service needs to add branch filtering manually.

#### Models That Use BelongsToBranch

| Model | BelongsToBranch Applied |
|---|---|
| Sale | Yes |
| Purchase | Yes |
| Expense | Yes |
| StockCount | Yes |
| CashRegister | Yes |
| CashRegisterSession | Yes |
| Employee (HRM) | Yes |
| PayrollRun (HRM) | Yes |
| LeaveRequest (HRM) | Yes |

**Models that do NOT use BelongsToBranch** — business-wide data, not branch-specific:
Product, Customer, Supplier, Warehouse, StockMovement, StockLevel, StockLot, StockSerial, Journal, ChartOfAccount, PaymentAccount, LoyaltyTransaction, User, Branch, TaxRate — these belong to the whole business.

#### Branch Scope and Warehouses

Warehouses link to branches via `warehouse.branch_id`. When a user is branch-scoped, the stock page and inventory pages filter to show only warehouses belonging to their allowed branches. This is done in the repository query — not via the BelongsToBranch trait.

#### Branch Scope and Stock Transfers — Special Rule

Stock transfers move stock between warehouses and can cross branches by design. The rules are:

- **Warehouse FROM and TO dropdowns** — show ALL warehouses in the business. A user must be able to transfer from Branch A warehouse to Branch B warehouse.
- **Stock transfer list page** — shows only transfers where the FROM warehouse OR the TO warehouse belongs to one of the user's allowed branches.
- **Creating a transfer** — the user does not pick a branch. The branch is inferred from the warehouse they select. The Form Request validates that at least one of the two warehouses belongs to an allowed branch.

#### Branch Scope and Reports

All reports that accept a `branch_id` filter:
1. If the user is branch-scoped: the branch filter dropdown shows only their allowed branches. They cannot request data for a branch outside their access. ReportService enforces this — it ignores any branch_id in the request that is not in the user's allowed list.
2. If the user is not branch-scoped (admin): the branch filter is a full dropdown of all branches, optional.

This logic lives in ReportService, not in the controller.

#### Creating a New Record

When a user creates a sale, purchase, or expense:
- The branch field is a **required dropdown** showing only the user's allowed branches.
- If the user is admin, the dropdown shows all branches.
- The selected branch_id is sent in the request. The Form Request validates that the branch_id is in the user's allowed list (or that the user is admin).
- BelongsToBranch does NOT auto-set branch_id on create — because the user must explicitly pick which branch the record belongs to when they have access to multiple.

#### Branch Scope Does Not Replace Tenant Scope

Both scopes always apply together:

```
Final query = WHERE business_id = {tenant_id} AND branch_id IN ({allowed_branch_ids})
```

Tenant scope always applies first. Branch scope applies second.

#### Frontend Branch Awareness

`/auth/me` returns the user's allowed branches as an array:
```json
{
  "user": {
    "allowed_branches": [
      { "id": "uuid-a", "name": "Branch A" },
      { "id": "uuid-b", "name": "Branch B" }
    ]
  }
}
```

- `authStore.user.allowed_branches` — array of branches the user can access
- If the array is empty and the user is not admin → show a "No branch access" error page
- Branch selector dropdowns on create forms show only branches from `allowed_branches`
- List pages include a branch filter dropdown populated from `allowed_branches`
- Admin always sees all branches — `allowed_branches` is ignored and a full branch list is loaded separately

---

### 2.7 Audit Layer — CRITICAL

This section defines how the system records a permanent, tamper-resistant log of every important action. Every developer and AI assistant must follow this for every service that performs important operations.

#### Why Auditing Exists

For a commercial ERP system, the business owner needs to be able to answer:
- "Who deleted that customer?" 
- "Who changed the selling price of this product?"
- "Who cancelled this confirmed sale, and when?"
- "Which user logged in on the night the cash went missing?"
- "What was the stock level before this adjustment was made?"

Without an audit log, these questions cannot be answered. With an audit log, every action is permanently recorded.

#### AuditService

A single service class `app/Services/AuditService.php`. It has one public method:

```
log(
    string $event,
    string $auditableType,
    string $auditableId,
    array  $oldValues = [],
    array  $newValues = [],
    ?string $notes = null
)
```

AuditService reads `auth()->id()`, `app('tenant')->id`, `app('branch_scope')`, the current IP address, and the user agent automatically — the caller never needs to pass these.

AuditService writes one row to `audit_logs`. It must never throw an exception — if the write fails (disk full, DB issue), it silently logs to the Laravel error log and continues. A failed audit write must never break the main operation.

AuditService is dispatched as a queued job (`AuditLogJob`) so it never slows down the HTTP response.

#### Auditable Trait

A convenience trait `app/Traits/Auditable.php` for models. It provides helper methods:

```
$model->auditCreated()   — logs event=created, newValues = model->toAuditArray()
$model->auditUpdated($old) — logs event=updated, oldValues = $old, newValues = model->toAuditArray()
$model->auditDeleted()   — logs event=deleted, oldValues = model->toAuditArray()
```

Each model that uses Auditable must implement `toAuditArray()` which returns only the fields that are meaningful to log — never passwords, never tokens, never encrypted values.

#### Where AuditService Is Called

AuditService is called from **Services only** — never from Controllers, Models, or Repositories. It is called at the END of each service method, after the main operation has succeeded and the DB::transaction has committed.

```
// ✅ Correct — called from Service after successful operation
class SaleService {
    public function completeSale(Sale $sale): Sale {
        DB::transaction(function() use ($sale) {
            // ... deductStock, postJournal, recordPayment ...
        });
        // Transaction committed. Now audit.
        $this->auditService->log('state_change', Sale::class, $sale->id,
            ['status' => 'confirmed'],
            ['status' => 'completed']
        );
        return $sale;
    }
}
```

```
// ❌ Wrong — called from Controller
class SaleController {
    public function complete(Sale $sale) {
        $this->saleService->completeSale($sale);
        $this->auditService->log(...); // WRONG — audit belongs in the service
    }
}
```

#### What Must Be Audited — Complete Event Catalogue

The following events MUST be logged. This is a minimum list — services may log additional events as needed.

**Authentication Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| login | Successful login | {} | { ip, user_agent } |
| login_failed | Failed login attempt | {} | { email, ip } |
| logout | User logs out | {} | {} |
| password_changed | User changes own password | {} | { changed_at } |
| password_reset | Password reset via email link | {} | { reset_at } |

**User Management Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | New user created | {} | { name, email, roles, branch_id } |
| updated | User profile edited | { old fields } | { new fields } |
| deleted | User soft-deleted | { name, email } | {} |
| role_assigned | Role added to user | { roles_before } | { roles_after } |
| status_changed | User activated/deactivated | { status_before } | { status_after } |

**Settings Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| updated | Any setting group saved | { group, old values } | { group, new values } |

**Product Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | New product created | {} | { name, sku, type, stock_tracking, selling_price } |
| updated | Product edited | { changed fields only } | { changed fields only } |
| deleted | Product soft-deleted | { name, sku } | {} |
| price_changed | selling_price or minimum_selling_price changed | { old_price } | { new_price } |

**Customer and Supplier Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | New contact created | {} | { name, code, type } |
| updated | Contact edited | { changed fields } | { changed fields } |
| deleted | Contact soft-deleted | { name, code } | {} |
| credit_limit_changed | Credit limit updated | { old_limit } | { new_limit } |

**Inventory Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| stock_adjusted | Manual adjustment in or out | { product, warehouse, qty_before } | { type, qty_change, qty_after, reason } |
| stock_transferred | Stock moved between warehouses | { from_warehouse, qty } | { to_warehouse, qty } |
| stock_count_started | Count session opened | {} | { warehouse, reference_no } |
| stock_count_completed | Count session finalised | {} | { warehouse, discrepancy_count } |
| lot_status_changed | Lot recalled, quarantined, or released | { lot_number, old_status } | { new_status, reason } |
| serial_written_off | Serial written off | { serial_number, old_status } | { reason } |

**Sale Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | Sale draft created | {} | { sale_number, customer, total } |
| confirmed | Sale confirmed (stock reserved) | { status: draft } | { status: confirmed } |
| completed | Sale completed (stock deducted) | { status: confirmed } | { status: completed, paid_amount } |
| cancelled | Sale cancelled | { status } | { status: cancelled, reason } |
| returned | Sale return processed | { status: completed } | { return_amount, refund_method } |
| payment_recorded | Payment added to sale | {} | { amount, method, payment_account } |
| discount_applied | Discount given on sale | { old_discount } | { new_discount, applied_by } |
| delivery_status_changed | Delivery status updated | { old_status } | { new_status } |

**Purchase Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | PO created | {} | { purchase_number, supplier, total } |
| received | Goods received | {} | { reference_no, items_received } |
| returned | Purchase return | {} | { return_amount } |
| cancelled | PO cancelled | { status } | { status: cancelled } |
| payment_recorded | Payment to supplier | {} | { amount, method } |

**Accounting Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| journal_posted | Any journal posted | {} | { journal_number, type, total } |
| journal_reversed | Journal reversal created | { original_journal_id } | { reversal_journal_id, reason } |
| coa_created | New COA account created | {} | { code, name, type } |
| coa_updated | COA account edited | { changed fields } | { changed fields } |
| coa_deleted | COA account deleted | { code, name } | {} |
| payment_account_transfer | Transfer between payment accounts | {} | { from, to, amount } |

**Expense Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| created | Expense recorded | {} | { amount, category, account } |
| updated | Expense edited | { changed fields } | { changed fields } |
| deleted | Expense deleted | { amount, category } | {} |

**Cash Register Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| session_opened | Cash register session opened | {} | { opening_float, register } |
| session_closed | Cash register session closed | {} | { closing_float, discrepancy, denominations } |

**Commission Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| commission_paid | Commission marked as paid | { status: pending } | { status: paid, expense_id } |

**Loyalty Events**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| points_adjusted | Manual loyalty adjustment | { old_balance } | { adjustment, reason } |

**HRM Events (Module)**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| employee_created | Employee record created | {} | { name, code, department } |
| employee_updated | Employee edited | { changed fields } | { changed fields } |
| payroll_finalised | Payroll run finalised | {} | { month, year, total_net } |
| leave_approved | Leave request approved | { status: pending } | { status: approved } |
| leave_rejected | Leave request rejected | { status: pending } | { status: rejected, reason } |

**Manufacturing Events (Module)**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| run_completed | Production run completed | { status: in_progress } | { qty_produced, total_cost } |

**Asset Events (Module)**

| Event | Trigger | oldValues | newValues |
|---|---|---|---|
| asset_created | Asset registered | {} | { name, code, value } |
| asset_allocated | Asset assigned to user | { assigned_to: null } | { assigned_to: user_name } |
| asset_disposed | Asset disposed | { status } | { status: disposed } |

#### Audit Log Viewer (Frontend)

A new page `AuditLogPage.vue` is accessible to admin and manager only (accountant has read-only access to accounting-related events).

Features:
- Filterable by: date range, event type, user, auditable type (Sale, Product, User, etc.), branch
- Each row is expandable — shows oldValues and newValues side by side in a diff view
- Cannot edit, delete, or export audit logs (read-only permanently)
- Pagination: 50 rows per page
- Admin can see all branches. Branch-scoped manager sees only their branch's audit events.

API endpoint: `GET /api/v1/audit-logs` — accepts filters: date_from, date_to, event, user_id, auditable_type, branch_id.

#### Audit Log Retention

Monthly `AuditLogArchiveJob` deletes records older than `system.audit_log_retention_months` (default 24 months). This runs on the first day of each month.

---

### 2.8 Golden Order — Every Feature

Backend first:
1. Migration — columns, indexes, constraints
2. Model — extends BaseModel, uses BelongsToBranch if has branch_id, uses Auditable if auditable
3. Form Request — input validation
4. API Resource — JSON response shape
5. Repository — database queries with Redis caching (branch scope applies automatically)
6. Service — all business logic. Zero auth knowledge. Calls AuditService at the end of each mutating operation.
7. Policy — authorization rules for this resource
8. API Controller — receives, delegates, returns. Calls authorize(). Zero business logic.

Frontend second:
9. API file — Axios functions only
10. Pinia Store — state and actions
11. Page Component — store actions only. No direct API calls. Uses can() for UI only. Hides branch selector if user is branch-scoped.
12. Tests — PHPUnit unit tests + feature tests including 401/403 cases and branch isolation cases

> Note: Services call AuditService at the END of every successful mutating operation. If the operation is inside a DB::transaction(), call AuditService AFTER the transaction commits — not inside it.

### 2.9 i18n Architecture

businesses.locale column (default en). Vue frontend uses Vue i18n with one file per active frontend language at `/frontend/src/i18n/en.js`, `/frontend/src/i18n/km.js`, etc. Keys are grouped inside each file by module and page so translation can be added page-by-page while the product is still growing. Backend error messages use Laravel `lang/{locale}/`.

Delivery rule for every frontend step or phase:
1. Any new page, modal, alert, table label, button label, helper text, or toast message must add its translation keys in the same task.
2. A page is not considered complete if new user-facing strings remain hardcoded in the Vue file.
3. `en` and `km` keys must be added together during implementation, not as a later cleanup pass.
4. Only split the frontend i18n files into many module files after the product has broad translation coverage and the single-file structure becomes a real maintenance problem.

### 2.10 AI Delivery Standard — Project Pattern

This section is mandatory for any AI or developer contributing code to the project. The goal is consistency first, speed second.

#### Backend pattern

Every backend feature must follow the same shape:
1. Migration
2. Model
3. Form Request
4. API Resource
5. Repository
6. Service
7. Policy
8. Controller
9. Tests

Required backend rules:
- Controllers stay thin: receive request, call authorize(), delegate to service/store layer, return API Resource.
- Services own business rules and workflow decisions. Services are auth-blind.
- Repositories own query composition, filtering, eager loading, and cache usage.
- Form Requests own validation and branch-access validation for incoming IDs.
- API Resources define the response contract. Do not return raw Eloquent models.
- New backend code must extend the shared base classes and reuse the existing traits instead of introducing parallel patterns.

#### Frontend pattern

Every frontend feature must follow the same shape:
1. API file in `frontend/src/api`
2. Pinia store in `frontend/src/stores`
3. Page view in `frontend/src/views`
4. Shared component only if the same UI pattern will be reused
5. Translation keys in `frontend/src/i18n/en.js` and `frontend/src/i18n/km.js`
6. Build verification

Required frontend rules:
- Views call store actions only. No direct Axios usage in page components.
- Stores call API files only. Do not duplicate fetch logic in multiple pages.
- If the UI purpose already exists, reuse the shared component or shared utility instead of creating a one-off version.
- Dates shown to users must use the shared date utility and default to human-friendly display unless a raw system format is explicitly required.
- Status badges, alerts, modals, tables, filter panels, selects, and date pickers must use the shared UI system before any page-specific alternative is considered.
- New pages must include loading, empty, validation, and error states using the established shared patterns.

#### Reuse-first rule

Before adding a new helper, component, composable, style pattern, or formatter, check whether the project already has one for the same job.

If an equivalent already exists:
- reuse it directly, or
- extend it carefully without breaking existing pages.

Do NOT create duplicate patterns for:
- date formatting
- status display
- table loading
- modal behavior
- select/dropdown behavior
- filter panels
- alert/toast behavior
- theme handling
- branch access handling

#### Completion standard

A task is not complete until all of the following are true:
1. The code follows the backend/frontend pattern above.
2. New user-facing text is translated in both `en` and `km`.
3. Reusable project patterns were used instead of one-off replacements unless a documented exception was necessary.
4. The changed scope is verified with the appropriate command (`npm run build`, PHPUnit/feature tests, or both).
5. The implementation does not leave partial placeholder logic behind unless the plan explicitly allows scaffolding.

---

## SECTION 3 — DATABASE SCHEMA

### Universal Column Rules

| Column | Type | Rule |
|---|---|---|
| id | CHAR(36) PK | UUID auto-generated by HasUuid |
| business_id | CHAR(36) FK | On every table except businesses |
| branch_id | CHAR(36) FK → branches | On all branch-scoped tables. Nullable on business-wide tables. |
| created_by | CHAR(36) FK → users | Nullable. Auto-set by HasUserTracking |
| updated_by | CHAR(36) FK → users | Nullable. Auto-set on update |
| created_at, updated_at | TIMESTAMP | Laravel-managed. Omit updated_at on append-only tables |
| deleted_at | TIMESTAMP NULL | SoftDeletes. Omit on junction and append-only tables |

Data types: Money = DECIMAL(15,2). Quantity = DECIMAL(15,4). Rate/% = DECIMAL(5,2). Boolean = TINYINT(1). Every FK column must have its own INDEX.

### MariaDB Requirements

DB_CONNECTION=mysql in .env (same PDO driver). UUIDs as CHAR(36). Generated stored columns: ->storedAs('expression'). Full-text: ->fullText(['col1','col2']). All tables: InnoDB, utf8mb4, utf8mb4_unicode_ci. Strict SQL mode in AppServiceProvider::boot(). Default string length 191.

### Append-Only Tables

stock_movements, journal_entries, journals, audit_logs, loyalty_transactions, account_transactions. These tables have no updated_at and no deleted_at. Rows are permanent. Corrections create new reversing rows.

---

### GROUP A — FOUNDATION (8 tables)

**businesses** — tenant root. Does NOT use BelongsToTenant or BelongsToBranch.
Columns: id, name, legal_name, tax_id, email (UNIQUE), phone, currency (CHAR 3, default USD), timezone (default UTC), country (CHAR 2), locale (VARCHAR 10, default en), address (JSON), logo_url, tier (ENUM: basic/standard/enterprise), status (ENUM: active/suspended/cancelled), max_users (INT), max_branches (INT), financial_year (JSON: {start_month}), settings_cache (JSON), created_at, updated_at, deleted_at.
Index: (status, created_at).

**branches**
Columns: id, business_id (INDEX), name, code (auto BR-001, UNIQUE per business), type (ENUM: retail/warehouse/office/online), address (JSON), phone, email, manager_id (FK → users, nullable, INDEX), is_active (default 1), is_default (default 0 — one per business), business_hours (JSON), invoice_settings (JSON), created_at, updated_at, deleted_at.
Unique: (business_id, code).

**warehouses**
Columns: id, business_id (INDEX), branch_id (FK → branches, nullable, INDEX), name, code (auto WH-001, UNIQUE per business), type (ENUM: main/transit/returns/damaged), is_active (default 1), is_default (default 0 — one per business), allow_negative_stock (default 0), created_at, updated_at, deleted_at.
Unique: (business_id, code).

**users** — updated in v10. No branch_id column — branch access managed via branch_users.
Columns: id, business_id (INDEX), first_name, last_name, email (UNIQUE), password (always hashed), phone, avatar_url, status (ENUM: active/inactive/suspended), max_discount (DECIMAL 5,2 — 0 = no limit), commission_percentage (DECIMAL 5,2, default 0), sales_target_amount (DECIMAL 15,2, default 0), last_login_at, preferences (JSON), email_verified_at, remember_token, created_at, updated_at, deleted_at.
Indexes: (business_id, status), (business_id, email).

Rules:
- super_admin and admin are never added to branch_users — they always bypass branch filtering.
- manager, cashier, inventory_manager, sales_representative must have at least one row in branch_users to access the system. Zero rows = 403 on every request.

**branch_users** — pivot table. Defines which branches a user can access.
Columns: id, business_id (INDEX), user_id (FK → users, INDEX), branch_id (FK → branches, INDEX), created_at.
Unique: (user_id, branch_id).
No updated_at. No deleted_at. Rows are deleted directly when access is revoked.

**settings** — unchanged from v9.

**audit_logs** — append-only. Updated in v10 with branch_id.
Columns: id, business_id (INDEX), branch_id (FK → branches, nullable, INDEX — branch where the action occurred), user_id (FK, nullable, INDEX), event (VARCHAR 50: created/updated/deleted/login/login_failed/logout/password_changed/password_reset/role_assigned/status_changed/branch_access_changed/state_change/payment_recorded/stock_adjusted/stock_transferred/session_opened/session_closed/journal_posted/journal_reversed/run_completed/commission_paid/points_adjusted/price_changed/credit_limit_changed/delivery_status_changed/lot_status_changed/serial_written_off/payroll_finalised/leave_approved/leave_rejected/employee_created/employee_updated/asset_created/asset_allocated/asset_disposed), auditable_type (VARCHAR 100), auditable_id (CHAR 36), old_values (JSON), new_values (JSON), notes (VARCHAR 500, nullable), ip_address, user_agent, created_at (NO updated_at).
Indexes: (business_id, created_at), (business_id, branch_id, created_at), (auditable_type, auditable_id), (business_id, event, created_at), (user_id, created_at).
Retention: monthly AuditLogArchiveJob deletes records older than system.audit_log_retention_months.

**custom_field_definitions** — unchanged from v9.

---

### GROUP B — TAX (3 tables)

tax_rates, tax_groups, tax_group_items — unchanged from v9. These are business-wide — no branch_id.

---

### GROUP C — CONTACTS (3 tables)

customer_groups, customers, suppliers — unchanged from v9. These are business-wide — no branch_id. Customers and suppliers belong to the entire business, not a single branch.

---

### GROUP D — CATALOG (13 tables)

All catalog tables unchanged from v9. Products, categories, brands, units, price groups, rack locations — all business-wide. No branch_id on catalog tables.

Design clarification for units and packaging:

- `units` and `sub_units` are business-wide measurement vocabulary only.
- Generic sub-unit conversions are valid when the conversion is stable across all products that use the same base unit.
- If two products need the same sub-unit label with different pack sizes, do not force that into the global `sub_units` table.
- Example:
  - Product A: `Can` -> `Case` = `24`
  - Product B: `Can` -> `Case` = `48`
- This must be handled at the Product phase with product-specific packaging/conversion records, not by a single global `Case` conversion under `Can`.
- Therefore, Product phase must support product-level pack definitions / unit conversions for selling, purchasing, barcodes, and price points.

---

### GROUP E — INVENTORY (6 tables)

All inventory tables unchanged from v9. stock_movements, stock_levels, stock_lots, stock_serials, stock_counts, stock_count_items — warehouse-scoped (not branch-scoped directly, but warehouses link to branches).

---

### GROUP F — SALES (11 tables)

**sales** — branch_id confirmed as required (not nullable for sales). All sales must belong to a branch.
All other sales tables unchanged from v9.

---

### GROUP G — PURCHASES (8 tables)

**purchases** — branch_id confirmed as required. All purchases must belong to a branch.
All other purchase tables unchanged from v9.

---

### GROUP H — ACCOUNTING (6 tables)

All accounting tables unchanged from v9. Journals are business-wide — no branch scope on accounting. Accountants see all branches.

---

### GROUP I — PAYMENTS AND EXPENSES (3 tables)

**expenses** — branch_id confirmed as required (nullable — some expenses may be business-wide).
All other payment and expense tables unchanged from v9.

---

### GROUP J — LOYALTY (2 tables)

Unchanged from v9. Business-wide.

---

### GROUP K — NOTIFICATIONS (1 table)

Unchanged from v9.

---

### GROUPS L through Q — Modules

**HRM Module** — employees, attendance_records, leave_requests, payroll_runs all have branch_id (employees are assigned to a branch).
**All other modules** — unchanged from v9.

---

## SECTION 4 — BUSINESS REQUIREMENTS, AUTHORIZATION, AND AUDIT RULES

### 4.1 — Multi-Tenancy

BelongsToTenant adds WHERE business_id = app('tenant')->id to every query. TenantResolver middleware binds tenant on every authenticated request. Suspended or cancelled business returns 403.

### 4.2 — Authentication

Login requires email + password. User AND business must both be active. On success: record last_login_at, write audit_log event=login. Failed login: write audit_log event=login_failed. Rate limit: 5 failures per minute per IP → 429. /auth/me returns user + business + roles + permissions + branch (name and id if set). Forgot password sends signed time-limited link via queue. Logout destroys current token only — write audit_log event=logout.

### 4.3 — Roles, Permissions, and Policies

Seven roles seeded at startup. Permissions use pattern: `{resource}.{action}`.

#### Complete Permission Matrix

| Permission | super_admin | admin | manager | cashier | accountant | inventory_manager | sales_rep |
|---|---|---|---|---|---|---|---|
| users.view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| branches.view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| branches.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| branches.edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| branches.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| warehouses.view | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| warehouses.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| warehouses.edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| warehouses.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.view | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings.edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| products.view | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| products.create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| products.edit | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| products.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| customers.view | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| customers.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| customers.edit | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| customers.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| suppliers.view | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| suppliers.create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| suppliers.edit | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| suppliers.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| sales.view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| sales.create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| sales.edit | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| sales.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| sales.confirm | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| sales.complete | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| sales.cancel | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| sales.return | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| purchases.view | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| purchases.create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| purchases.edit | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| purchases.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| purchases.receive | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| purchases.return | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| inventory.view | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| inventory.adjust | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| inventory.transfer | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| inventory.count | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| accounting.view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| accounting.journals | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| accounting.coa | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| expenses.view | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| expenses.create | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| expenses.edit | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| expenses.delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| reports.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports.financial | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| reports.own_only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| audit_logs.view | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| hrm.view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| hrm.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| hrm.payroll | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

#### Policy Rules Per Resource

All Policy rules are unchanged from v9, plus the following additions:

**AuditLogPolicy:**
- `viewAny`: admin, manager, accountant (accountant sees only accounting-related events)
- `view`: same as viewAny — branch-scoped manager sees only their branch's events
- `create`, `update`, `delete`: ALWAYS return false — audit logs are permanently read-only

**UserPolicy (updated):**
- `update`: admin only — admin cannot add branch_users rows for another admin or accountant (they always bypass branch filtering)
- All other rules unchanged from v9

### 4.4 — Branch Data Filter Layer

See Section 2.6 for the full specification. Summary of enforcement rules:

- BranchScopeMiddleware runs after TenantResolver on every authenticated request.
- It loads the user's allowed branch IDs from branch_users into app('branch_scope') as an array.
- admin always bypasses branch filtering — app('branch_scope') is set to null for admin.
- Any other role with zero rows in branch_users gets a 403 abort immediately in BranchScopeMiddleware.
- BelongsToBranch trait adds WHERE branch_id IN (allowed_ids) automatically on all qualifying models.
- Stock transfer list is filtered by FROM or TO warehouse belonging to an allowed branch.
- Stock transfer warehouse dropdowns always show all warehouses in the business (cross-branch transfers allowed).
- Reports enforce the user's allowed branch list in ReportService — users cannot request data for branches outside their access.
- Branch selector on create forms (sale, purchase, expense) shows only the user's allowed branches.
- The /auth/me response includes allowed_branches: [{ id, name }, ...] or [] for admin (full list fetched separately).

### 4.5 — Settings

Redis-cached indefinitely per business. Cache busts on any write. Only admin can read or write settings. AuditService logs event=updated with old and new setting values on every save.

### 4.6 — Product and Stock Tracking Rules

Each product has one stock_tracking value (none/lot/serial). Cannot change after stock movements exist. AuditService logs event=updated (price_changed) when selling_price or minimum_selling_price changes.

### 4.7 — Inventory Movement Rules

All changes through StockMovementService. Reserve on confirm, deduct on complete, release on cancel, return restores. DB::lockForUpdate() required when reading stock in transaction. AuditService logs stock_adjusted and stock_transferred events from StockAdjustmentService and StockTransferService respectively.

### 4.8 — Sale State Machine

Valid transitions: draft→confirmed, draft→cancelled, confirmed→completed, confirmed→cancelled, completed→returned, quotation→converted, quotation→cancelled, suspended→confirmed, suspended→cancelled. Any other throws InvalidStateTransitionException.

AuditService logs: created (on draft creation), confirmed, completed, cancelled, returned — each as a separate state_change event with old and new status in the values.

### 4.9 — Recurring Sales

Enabled by pos.enable_subscriptions setting. RecurringSaleJob runs daily. Creates new draft sale. AuditService logs created event on each auto-generated recurring sale with notes = "Auto-generated recurring from {parent_sale_number}".

### 4.10 — Commission Rules

Enabled by sales.enable_commission. Commission rows created on sale completion only. AuditService logs commission_paid when admin marks a commission as paid.

### 4.11 — Sales Targets

Monthly targets per user. AuditService logs created and updated events on SaleTarget changes.

### 4.12 — Purchase Receive Rules

Stock enters only at receive time. AuditService logs created event when a purchase receive is recorded.

### 4.13 — Accounting Rules

postJournal() validates balance before any write. AuditService logs journal_posted on every successful postJournal() call. AuditService logs journal_reversed on every successful reverseJournal() call with the reason in notes.

### 4.14 — Payment Rules

AuditService logs payment_recorded on every sale payment and purchase payment, including the method and amount in newValues.

### 4.15 — Gift Cards and Coupons

AuditService logs created when a gift card is issued and when a coupon is created.

### 4.16 — CRM Rules

AuditService logs created when a lead is created and state_change when a lead's life_stage changes.

### 4.17 — Manufacturing Rules

AuditService logs run_completed when a manufacturing run is finalised, including qty_produced and total_cost.

### 4.18 — Asset Management Rules

AuditService logs asset_created, asset_allocated, and asset_disposed events.

### 4.19 — Loyalty Rules

AuditService logs points_adjusted when an admin manually adjusts a customer's loyalty points. Normal earn and redeem transactions are logged through the loyalty_transactions append-only table and do not need a separate audit entry.

### 4.20 — Customer Display Screen

Public endpoint — no auth required. No audit logging for read-only public endpoints.

### 4.21 — SMS Notifications

When sms.is_active is true, all notification jobs send both email and SMS.

### 4.22 — Automated Scheduled Jobs

Same 10 core jobs as v9. Same 3 module jobs. All registered in routes/console.php scheduler.

### 4.23 — Dashboard and Reports

Dashboard cached per business with 5-minute TTL. All 30 reports accept date filters. All export to Excel. Branch-scoped users see only their branch's data in all reports. ReportPolicy restricts financial reports to admin and accountant.

### 4.24 — HRM Module

PayrollService reads pending sale_commissions for each employee and includes total in payroll_item.sales_commission. Finalizing payroll marks commission rows as paid. AuditService logs payroll_finalised, leave_approved, leave_rejected, employee_created, and employee_updated events.

### 4.25 — Audit Log Rules

- Audit logs are append-only — no UPDATE or DELETE ever.
- AuditService is always called from Services, never from Controllers.
- AuditService dispatches as a queued job — it never blocks the HTTP response.
- A failed audit write must never cause the main operation to fail.
- Passwords, tokens, and encrypted values are NEVER written to audit_logs.
- audit_logs.branch_id is automatically set from app('branch_scope') by AuditService.

---

## SECTION 5 — API CONTRACT

Success single: { success: true, message: "OK", data: { record } }
Success paginated: { success: true, data: [...], meta: { current_page, last_page, per_page, total } }
Validation error 422: { success: false, message: "Validation failed.", errors: { field: ["msg"] } }
Business rule error 400: { success: false, message: "Human-readable description." }
Unauthenticated 401: { success: false, message: "Unauthenticated." }
Forbidden 403: { success: false, message: "This action is unauthorized." }
Not found 404: { success: false, message: "Record not found." }
Server error 500: { success: false, message: "An unexpected error occurred." }

Global exception handler converts all api/* exceptions to JSON. Never HTML.
Auth routes: 5 req/min per IP. All other routes: 300 req/min per user.

The /auth/me response now includes:
```
{
  user: { id, name, email, roles, permissions, allowed_branches: [{ id, name }] }
  business: { id, name, currency, locale, ... }
}
```

For admin, allowed_branches is an empty array — the frontend loads the full branch list separately via GET /api/v1/branches when needed.

---

## SECTION 6 — COMPLETE API ENDPOINT LIST

All endpoints same as v9, plus the following new endpoints:

```
AUDIT LOGS — AuditLogPolicy
GET  /api/v1/audit-logs               — paginated, filterable list (date, event, user, type, branch)
GET  /api/v1/audit-logs/{id}          — single audit log entry detail

BRANCH ACCESS MANAGEMENT — UserPolicy (admin only)
GET  /api/v1/users/{id}/branches      — list branches currently assigned to a user
PUT  /api/v1/users/{id}/branches      — replace the full set of branch_users rows for a user
                                        body: { branch_ids: ['uuid-a', 'uuid-b'] }
                                        sending empty array removes all access (valid for non-admin roles)
```

All other endpoints unchanged from v9.

---

## SECTION 7 — BASE CLASSES AND SERVICES

### BaseModel

All models extend App\Models\BaseModel except User (extends Authenticatable) and Business (no BelongsToTenant).
BaseModel uses: HasUuid, BelongsToTenant, HasUserTracking, SoftDeletes.

Branch-scoped models additionally use: BelongsToBranch.
Auditable models additionally use: Auditable.

### BaseApiController

Methods: success(), paginated(), error().
Every controller method calls $this->authorize() BEFORE calling any service.

### BaseRepository

CRUD with Redis caching. Keys always include business_id. Bust cache on every write. Branch scope is applied automatically through the BelongsToBranch trait — repositories do not need to add branch filtering manually.

### AuditService

Single entry point for all audit writes. Located at app/Services/AuditService.php.
Dispatches AuditLogJob to the queue — never writes synchronously.
Reads business_id, branch_id, user_id, ip_address, user_agent automatically.
Never throws exceptions — failures are silently logged to Laravel error log.

### Domain Exceptions

All 11 domain exceptions as defined in v9 — unchanged.

### Critical Services — Authorization and Audit Reminder

```
StockMovementService  — zero auth knowledge. Calls AuditService for adjustments and transfers.
AccountingService     — zero auth knowledge. Calls AuditService for journal_posted and journal_reversed.
SaleService           — zero auth knowledge. Calls AuditService for every sale state transition.
PurchaseService       — zero auth knowledge. Calls AuditService for receive and return events.
PaymentService        — zero auth knowledge. Calls AuditService for every payment_recorded event.
ExpenseService        — zero auth knowledge. Calls AuditService for created, updated, deleted events.
All other services    — zero auth knowledge. Each calls AuditService for its own events.
```

---

## SECTION 8 — FRONTEND ARCHITECTURE RULES

api/*.js — Axios functions only. No state.
stores/*.js — state + actions calling api files. Never import axios directly.
pages/*.vue — call store actions only. Zero direct API calls.
components/ui/*.vue — purely presentational.

**Branch awareness in the frontend:**
- `authStore.user.allowed_branches` contains an array of `{ id, name }` objects — the branches this user is allowed to access.
- If `allowed_branches` is empty and the user is not admin → show a full-screen "No Branch Access" error page. Do not allow navigation to any other page until admin assigns at least one branch.
- Branch selector dropdowns on create forms (sale, purchase, expense) are populated from `allowed_branches` only. Admin loads the full branch list from GET /api/v1/branches instead.
- List pages (sales, purchases, expenses) include a branch filter dropdown populated from `allowed_branches`. Selecting a branch filters the list to that branch only. Clearing the filter shows all allowed branches merged.
- Admin always sees all branches — no restriction in the UI.

**Frontend authorization using `can()`:**
The `authStore.can('permission.string')` helper is used to show or hide buttons and nav items. This is purely cosmetic — it improves UX but provides zero security. The backend Policy is the only real security layer.

All other frontend rules unchanged from v9.

---

## SECTION 9 — TECH STACK

### Backend
Laravel 11.x, MariaDB 10.11 LTS, Redis 7.x, Laravel Sanctum, Spatie Permission, Spatie Media Library, barryvdh/laravel-dompdf, maatwebsite/excel, darkaonline/l5-swagger, nwidart/laravel-modules.

### Frontend
Vue 3 (latest), Pinia 2.x, Vue Router 4.x, Axios (latest), VeeValidate 4 + Yup, Tailwind CSS 3.x, Headless UI (Vue), Heroicons (Vue), Chart.js + vue-chartjs 4.x, Vue Toastification, Vue i18n (latest), Day.js, Vite (latest).

---

## SECTION 10 — BUILD ORDER

Each phase must be fully working and tested before the next begins.

**Phase 1 — Environment**
Docker Compose (MariaDB 10.11, Redis 7, phpMyAdmin, MailHog). Laravel 11. .env configured. Strict SQL mode. Catch-all web route. SPA Blade entry. /frontend with Vite + Vue 3. All npm packages. Tailwind configured. Vite proxy configured. Vue i18n setup with `frontend/src/i18n/en.js` and `frontend/src/i18n/km.js`.

**Phase 2 — Backend Foundation (Critical Path)**
HasUuid, BelongsToTenant, BelongsToBranch, HasUserTracking, Auditable traits.
BaseModel, BaseRepository, BaseApiController.
All 11 domain exception classes.
Global JSON exception handler — must convert AuthorizationException to 403 JSON.
TenantResolver middleware.
BranchScopeMiddleware — runs after TenantResolver. Loads allowed branch IDs from branch_users into app('branch_scope'). Bypasses admin only. Aborts 403 if a branch-scoped user has zero branch_users rows.
AuditService and AuditLogJob — queue-dispatched. Test that a failed audit write does not break the calling operation.
Group A migrations — including branch_users pivot table and updated audit_logs table with branch_id and expanded event ENUM. No branch_id column on users.
Seed 7 roles + all permissions from Section 4.3 (including audit_logs.view), all setting groups, 21 COA accounts.
Full auth API. Login writes audit_log event=login. Failed login writes event=login_failed. Logout writes event=logout.
Policies: Register Gate::before for super_admin in AuthServiceProvider.
Tests:
- All 6 auth endpoints work.
- Login creates audit_log row.
- Cashier calling POST /api/v1/users returns 403.
- Cashier with NO branch_users rows calling GET /api/v1/sales returns 403.
- Cashier with branch_users rows for Branch A calling GET /api/v1/sales cannot see Branch B sales.
- Cashier with branch_users rows for Branch A AND Branch B can see both branches' sales merged.

**Phase 3 — Frontend Foundation**
Shared Axios instance. Vue Router with all layouts and auth guard.
AppSidebar, AppTopbar, NotificationBell.
All shared UI components. Auth Pinia store with can(), hasRole(), and branch helpers.
LoginPage, ForgotPasswordPage, ResetPasswordPage.
Branch awareness: authStore reads allowed_branches array from /auth/me response. If allowed_branches is empty and user is not admin → redirect to a "No Branch Access" error page with a message to contact the administrator.

**Phase 4 — Foundation Features**
Users, Branches, Warehouses, Settings, Custom Field Definitions.
BelongsToBranch: NOT applied to these — they are business-wide configuration.
branch_users management: User edit page includes a branch access checklist. Admin can assign zero or many branches per user. UserService rejects branch assignment for admin roles only; accountant can be assigned branches.
Audit events: user created/updated/deleted/role_assigned/status_changed/branch_access_changed. Settings updated.
Policies: UserPolicy, BranchPolicy, WarehousePolicy, SettingsPolicy, CustomFieldPolicy, AuditLogPolicy.
UserPolicy updated: admin cannot add branch_users rows for another admin.
Vue pages: user edit form shows branch access checklist. Branch selector on create-record forms shows only allowed_branches.

**Phase 5 — Tax and Contacts**
Tax Rates, Tax Groups, Customer Groups, Customers, Suppliers.
BelongsToBranch: NOT applied — contacts are business-wide.
Audit events: customer created/updated/deleted/credit_limit_changed. Supplier created/updated/deleted.
Policies: TaxRatePolicy, TaxGroupPolicy, CustomerGroupPolicy, CustomerPolicy, SupplierPolicy.

**Phase 6 — Catalog**
Categories, Brands, Units, Sub-Units, Variation Templates, Price Groups, Rack Locations, Products.
BelongsToBranch: NOT applied — catalog is business-wide.
Audit events: product created/updated/deleted/price_changed.
Policies: CategoryPolicy, BrandPolicy, UnitPolicy, PriceGroupPolicy, RackLocationPolicy, ProductPolicy.

**Phase 7 — Inventory**
Group E migrations. All inventory models and services.
BelongsToBranch: NOT applied directly — stock is warehouse-scoped. Warehouse queries filter by warehouses belonging to the user's allowed branches.
Stock transfer special rule: warehouse FROM and TO dropdowns show ALL warehouses in the business (cross-branch transfers allowed). Transfer list is filtered by branch access with one workflow refinement: source-side users may see `pending`, `in_transit`, and `received` transfers for their allowed FROM branches, but destination-side users should only see transfers for their allowed TO branches after the document has been marked `in_transit`.
Important implementation note: Group E also needs workflow header tables for `stock_adjustments`, `stock_adjustment_items`, `stock_transfers`, and `stock_transfer_items` in addition to the stock ledger tables. `stock_movements` remains the append-only source of truth for quantities, but the workflow tables provide the business documents used for list pages, audit context, and reference numbers.
Transfer authorization rule refinement: a branch-scoped user may create a transfer only when the FROM warehouse belongs to one of their allowed branches. The TO warehouse may be any warehouse in the same business to support cross-branch transfers.
Stock transfer workflow refinement: transfers move through three statuses: `pending -> in_transit -> received`. `pending` is the editable draft state. `in_transit` records sender confirmation by capturing `sent_by` and `sent_at`. `received` captures `received_by` and `received_at` and finalizes the stock movement into the destination warehouse. This provides an explicit sender/receiver agreement trail and prevents destination stock from appearing before receipt is acknowledged.
Stock transfer UI refinement: the list page should not directly confirm receipt. Users open a dedicated transfer preview/detail page first, review the route and line items, then confirm receipt from that page only. This keeps the workflow deliberate and reduces wrong-warehouse or wrong-item confirmations.
Stock transfer pending-state refinement: the initial transfer document should be created as `pending`, not as a posted movement. While `pending`, the source quantity is reserved/locked so it cannot be reused elsewhere, but no stock is deducted and the destination side must not see it yet. `pending` and `in_transit` transfers remain editable by the original sender (owner) or an admin-level user. The form must support both `Save` and `Save and Send`: `Save` keeps the document as `pending`, while `Save and Send` changes it to `in_transit` and exposes it to the destination side for receipt. Even after `in_transit`, the source quantity remains reserved and is not deducted yet. Only when the destination confirms `received` is the reservation consumed into the outbound transfer movement and the inbound destination movement posted.
Stock count rule refinement: when a stock count session is opened, each `stock_count_item.system_quantity` must snapshot the current stock level at that moment. Completing the count compares against that snapshot and writes only the difference as `stock_count_correction` movements.
Stock count workflow refinement: the real stock count process compares physical count against the warehouse's current ending stock from the system. The practical default workflow is quantity-based entry only, even for products tracked by lot or serial. Later, inventory settings should support a configurable stock count mode such as `count_by = qty | lot | serial`. Default should remain `qty` for speed and operational simplicity, while `lot` and `serial` modes can be enabled only for businesses that require stricter counting workflows.
Stock count live-entry refinement: default count sessions should support shared live counting by multiple users in the same session while the count status is `in_progress`. Repeated scans or searches of the same product/variation must accumulate into one counted total for that session, while the system keeps an internal append-only count-entry journal for auditability and future expansion into lot/serial-specific count modes.
Stock count edit refinement: users may edit counted row totals only while the session status is `in_progress`. Editing a row sets a new absolute counted total in the UI, but the backend must record only the delta as a new append-only count-entry row so the live count history remains auditable.
Stock count completion refinement: once a stock count status becomes `completed`, the session becomes read-only. Users may review the counted lines and discrepancies, but they must not add entries, change counted quantities, or reopen the finished session. Any correction after completion requires a new stock count or a separate inventory adjustment workflow.
Stock count UI refinement: the frontend stock count flow should use full pages, not modal dialogs. The expected flow is `Count List -> Start Count Page -> Live Count Workspace Page -> Completed Preview Page`.
Serial write-off rule refinement: writing off a serial must update the serial status to `written_off` and also create an outbound stock movement so serial state and stock ledger remain consistent.
Frontend integration note: Inventory pages need a dedicated options endpoint so branch-scoped users can receive normal warehouse dropdowns filtered by allowed branches, while stock transfer destination warehouses still return the full business warehouse list.
Scanner-first inventory entry note: adjustment, transfer, and count forms should provide a single search/scan field above the item table. It must support matching by SKU, variation SKU, product name, description, lot number, and serial number. Selecting a result should append it directly into the line table, and repeated scans of the same exact item should merge intelligently instead of forcing duplicate manual lines.
Audit events: stock_adjusted, stock_transferred, stock_count_started, stock_count_completed, lot_status_changed, serial_written_off.
LotSelector, SerialScanner Vue components. All inventory Vue pages.
Policies: StockAdjustmentPolicy, StockTransferPolicy, StockCountPolicy, LotPolicy, SerialPolicy.
Tests: Branch-scoped inventory_manager can only view and adjust stock in warehouses linked to their allowed branches. Stock transfer between two branches creates correctly, remains hidden from the destination side while `pending`, becomes visible after `in_transit`, and completes correctly on `received`.

**Phase 8 — Accounting (Must finish before Phase 9)**
Group H migrations. AccountingService. COA seeding. All accounting Vue pages.
BelongsToBranch: NOT applied — accounting is business-wide. Accounting data remains business-wide, but accountant is not a global bypass role in branch-scoped modules.
Audit events: journal_posted, journal_reversed, coa_created, coa_updated, coa_deleted, payment_account_transfer.
Policies: JournalPolicy, ChartOfAccountPolicy, PaymentAccountPolicy, FiscalYearPolicy.

**Phase 9 — Sales and POS**
Group F migrations. SaleService full state machine. QuotationService. CashRegisterService. All sales Vue pages.
BelongsToBranch: APPLIED to Sale model. Branch-scoped user's sales are automatically filtered to their branch.
Audit events: sale created, confirmed, completed, cancelled, returned, payment_recorded, discount_applied, delivery_status_changed, session_opened, session_closed.
Policies: SalePolicy, QuotationPolicy, CashRegisterPolicy, SaleReturnPolicy.
Frontend: Branch selector on create-sale form shows only the user's allowed_branches. Admin sees all branches. Sale list includes a branch filter dropdown showing only allowed branches.
Tests: Cashier at Branch A cannot see Branch B's sales. Cashier cannot cancel a sale.

**Phase 10 — Purchases**
Group G migrations. PurchaseService. All purchase Vue pages.
BelongsToBranch: APPLIED to Purchase model.
Audit events: purchase created, received, returned, cancelled, payment_recorded.
Policies: PurchasePolicy, PurchaseReturnPolicy.
Tests: Branch-scoped inventory_manager sees only purchases from their allowed branches merged.

**Phase 11 — Payments and Expenses**
PaymentService. ExpenseService. Vue pages.
BelongsToBranch: APPLIED to Expense model.
Audit events: expense created/updated/deleted, payment_recorded (covered in Phase 9/10).
Policies: SalePaymentPolicy, PurchasePaymentPolicy, ExpensePolicy.

**Phase 12 — Commission and Sales Targets**
CommissionService, SaleTargetService.
BelongsToBranch: NOT applied — commissions are user-scoped, not branch-scoped.
Audit events: commission_paid.
Policies: CommissionPolicy, SaleTargetPolicy.

**Phase 13 — Loyalty**
LoyaltyService. POS integration. LoyaltyPointsExpireJob.
BelongsToBranch: NOT applied — loyalty is customer-level, business-wide.
Audit events: points_adjusted (manual adjustments only).
Policies: LoyaltyPolicy.

**Phase 14 — Reports and Dashboard**
DashboardService. ReportService. All 30 report Vue pages. AuditLogPage.
BelongsToBranch: Reports enforce branch scope in ReportService — not via the trait.
Policies: ReportPolicy, AuditLogPolicy.
AuditLogPage: filterable by date, event, user, type, branch. Read-only. Admin sees all branches. Branch-scoped manager sees only their branch.

**Phase 15 — Notifications**
NotificationService. All 10 core scheduled jobs. SMS integration. Notifications Vue page.
No new Policies. No new audit events (notifications are informational, not transactional).

**Phase 16 — HRM Module**
9 HRM migrations in Modules/HRM/ — employees include branch_id.
BelongsToBranch: APPLIED to Employee, AttendanceRecord (via employee), LeaveRequest, PayrollRun.
Audit events: employee_created, employee_updated, payroll_finalised, leave_approved, leave_rejected.
Policies: EmployeePolicy, AttendancePolicy, LeavePolicy, PayrollPolicy (all in Modules/HRM/Policies/).
Tests: Branch-scoped manager sees only employees assigned to their branch.

**Phase 17 — Installment Module**
2 installment migrations. InstallmentService. InstallmentOverdueJob.
BelongsToBranch: NOT applied — installments follow the sale/purchase they are linked to.
Audit events: none additional — covered by the payment_recorded event via PaymentService.
Policies: InstallmentPolicy.

**Phase 18 — CRM Module**
4 CRM migrations. CRM services. Contact portal auth.
BelongsToBranch: NOT applied — CRM leads are business-wide.
Audit events: lead created, lead state_change (life_stage).
Policies: CrmLeadPolicy, CrmCampaignPolicy.

**Phase 19 — Gift Card Module**
2 gift card migrations. GiftCardService, CouponService. POS integration.
BelongsToBranch: NOT applied — gift cards are business-wide.
Audit events: gift card created.
Policies: GiftCardPolicy, CouponPolicy.

**Phase 20 — Manufacturing Module**
3 manufacturing migrations. ManufacturingService.
BelongsToBranch: NOT applied — manufacturing is warehouse/product scoped.
Audit events: run_completed.
Policies: ManufacturingRecipePolicy, ManufacturingRunPolicy.

**Phase 21 — Asset Management Module**
3 asset migrations. AssetService. AssetWarrantyExpiryJob.
BelongsToBranch: NOT applied — assets are business-wide (assigned to users, not branches).
Audit events: asset_created, asset_allocated, asset_disposed.
Policies: AssetPolicy, AssetMaintenancePolicy.

**Phase 22 — Testing and Security**
PHPUnit unit tests — 80%+ coverage. Priority services same as v9.

Additional test requirements for v10:

Branch scope tests:
- Cashier with NO branch_users rows calling any API endpoint must return 403.
- Cashier assigned to Branch A only must NOT see Branch B's sales.
- Cashier assigned to Branch A AND Branch B must see both branches' sales merged in one list.
- Admin calling GET /api/v1/sales must see ALL branches' sales.
- Branch-scoped manager calling GET /api/v1/reports/sales must only see their allowed branches' data.
- Branch-scoped inventory_manager can only view stock in warehouses linked to their allowed branches.
- Stock transfer between Branch A warehouse and Branch B warehouse: user with Branch A access can see it in their transfer list. User with Branch B access can also see it.
- A branch-scoped user sending branch_id of an unallowed branch in a POST request must receive 422 validation error.

Audit log tests:
- Successful login must create an audit_log row with event=login.
- Failed login must create an audit_log row with event=login_failed.
- Completing a sale must create audit_log rows with event=state_change and event=payment_recorded.
- Manual stock adjustment must create audit_log row with event=stock_adjusted.
- Posting a journal must create audit_log row with event=journal_posted.
- Audit logs must NEVER contain password values.
- A failed audit write (simulate by breaking the queue) must NOT cause the sale completion to roll back.
- GET /api/v1/audit-logs as cashier must return 403.

Authorization tests (same as v9):
- Every controller endpoint tested for 401 and 403.
Rate limiting, CORS, N+1 elimination — same as v9.

**Phase 23 — Production Deployment**
Ubuntu 22.04. Nginx. PHP 8.2-fpm. MariaDB 10.11 (not Docker). Redis. Supervisor. Let's Encrypt SSL. Daily backup to S3. GitHub Actions CI/CD. Sentry error monitoring. Same as v9.

---

## SECTION 11 — ABSOLUTE RULES

| # | Rule | Consequence |
|---|---|---|
| 1 | Stock NEVER modified directly. Always StockMovementService. | Ledger corrupted. Unrecoverable. |
| 2 | journal_entries NEVER updated or deleted. Use reverseJournal(). | Trial balance permanently broken. |
| 3 | Business logic NEVER in Controllers. Only in Services. | Logic untestable and hidden. |
| 4 | Every multi-table write MUST use DB::transaction(). | Partial writes corrupt data permanently. |
| 5 | Always validate in Form Requests before Service sees data. | Invalid data causes deep failures. |
| 6 | Always return data through API Resources. Never raw Eloquent. | Sensitive fields leak in responses. |
| 7 | Never commit .env to Git. | All credentials become public. |
| 8 | Accounting MUST be built before Sales. | Auto-posting on sale completion impossible to retrofit. |
| 9 | All models MUST use BelongsToTenant. | Business A reads Business B's data. |
| 10 | Redis cache keys MUST include business_id. | Cross-tenant cache reads. Security breach. |
| 11 | Never LIKE %term% on products or customers. Use FULLTEXT. | Queries time out at scale. |
| 12 | stock_tracking CANNOT change after movements exist. | Historical data unreconcilable. |
| 13 | Serial quantity is ALWAYS exactly 1 per movement. | Serial tracking invariant breaks. |
| 14 | Duplicate serial numbers within one business are NEVER allowed. | Two records claim the same unit. |
| 15 | Never sell from expired or recalled lots. Throw typed exception. | Expired products reach customers. |
| 16 | Reserve stock on CONFIRM. Deduct only on COMPLETE. | Two cashiers can both sell the last unit. |
| 17 | Use DB::lockForUpdate() reading stock inside a transaction. | Race condition: concurrent oversell. |
| 18 | Module models use app/ base classes. Never duplicate. | BelongsToTenant silently diverges. |
| 19 | Never use <a href> for internal SPA navigation. Use RouterLink. | Page reload destroys Vue state. |
| 20 | Page components call store actions only. No direct api imports. | API logic in components = untestable. |
| 21 | Installment module calls core PaymentService only. Never writes to sale_payments directly. | Payments bypass accounting journals. |
| 22 | Combo products always track_inventory=false, stock_tracking=none. Components handle own stock. | Stock double-counted. |
| 23 | Sale uses INV prefix. Quotation uses QT prefix. Separate sequential counters per business. | Invoice and quotation numbers collide. |
| 24 | Minimum selling price check in SaleService BEFORE stock reservation. | Products sold below minimum price. |
| 25 | Commission rows created on sale COMPLETION only, never on draft or confirm. | Commission counted on cancelled sales. |
| 26 | Authorization NEVER checked in Services. Only in Controllers via $this->authorize(). | Services become HTTP-only, breaking jobs and CLI commands. |
| 27 | Every controller method MUST call $this->authorize() before calling any service. | Any role can perform any action if route middleware is misconfigured. |
| 28 | Frontend can() checks are UI-only cosmetic helpers. Backend Policy is the ONLY real security layer. | Hiding a button is not security. Direct API calls bypass all frontend checks. |
| 29 | Branch-scoped users CANNOT send a branch_id in requests that is not in their branch_users rows. Form Request must validate branch_id is in the user's allowed list. | User accesses another branch's data by guessing a branch UUID. |
| 30 | AuditService MUST be called from Services only — never from Controllers, Models, or Repositories. | Audit calls are lost in non-HTTP contexts (queue jobs, CLI commands). |
| 31 | A failed audit write MUST NOT cause the main operation to fail or roll back. | One broken queue worker silently stops all sales, purchases, and state changes. |
| 32 | New frontend pages MUST add `en` and `km` translation keys in the same task. | Hardcoded UI text accumulates and translation becomes permanent cleanup debt. |
| 33 | Views MUST use store actions only. Never import Axios or call HTTP directly from a page component. | API logic spreads across the UI and becomes inconsistent and untestable. |
| 34 | If a shared UI component or utility already exists for the same purpose, it MUST be reused or extended instead of duplicated. | The design system drifts and identical behavior breaks in different ways. |
| 35 | Human-facing dates MUST use the shared date formatting utilities unless a raw system format is explicitly required. | Users see inconsistent date formats across modules and the UI feels unfinished. |
| 36 | New backend endpoints MUST return API Resources, not raw models or ad hoc arrays. | Response contracts drift and frontend integration becomes brittle. |
| 37 | A phase or page is NOT complete until the changed scope passes build/tests appropriate to that scope. | Broken code is treated as done and defects compound into later phases. |

---

## SECTION 12 — COMPLETE POLICY REFERENCE

### Core Policies (app/Policies/)

| Policy | Key Rules |
|---|---|
| UserPolicy | create/edit: admin only. delete: admin only, not self, not last admin. branch access: admin cannot add branch_users rows for another admin. |
| BranchPolicy | delete: not if has sales, purchases, or employees. |
| WarehousePolicy | delete: not if has stock movements. |
| ProductPolicy | delete: not if has movements. update: block stock_tracking change if movements exist. |
| CustomerPolicy | create: admin, manager, cashier, sales_rep. delete: admin, manager only. |
| SupplierPolicy | delete: admin only. cashier has no access. |
| TaxRatePolicy | delete: not if used by products or tax groups. |
| SalePolicy | cancel/return: admin, manager only. update: only on draft status. viewOwn for sales_rep. |
| PurchasePolicy | cashier: zero access. delete: admin only, draft status only. |
| JournalPolicy | delete: ALWAYS false — journals are permanent. reverse: admin, accountant. |
| ChartOfAccountPolicy | delete: not if is_system=1, not if has entries. update: block if is_system=1. |
| ExpensePolicy | delete: admin only. |
| CommissionPolicy | view: sales_rep sees own only. pay: admin only. |
| SaleTargetPolicy | create/edit: admin, manager. view own: sales_rep. |
| ReportPolicy | financial reports: admin, accountant only. Branch-scoped users: forced to own branch. |
| AuditLogPolicy | view: admin, manager, accountant. create/update/delete: ALWAYS false — read-only permanently. |

### Module Policies (Modules/{Name}/Policies/)

| Policy | Location | Key Rules |
|---|---|---|
| EmployeePolicy | Modules/HRM/Policies/ | view: admin, manager. manage: admin only. branch-scoped manager sees only own branch employees. |
| PayrollPolicy | Modules/HRM/Policies/ | finalize: admin, accountant. delete: ALWAYS false. |
| InstallmentPolicy | Modules/Installment/Policies/ | manage: admin, manager, accountant. |
| CrmLeadPolicy | Modules/CRM/Policies/ | manage: admin, manager, sales_rep. convert: admin, manager. |
| GiftCardPolicy | Modules/GiftCard/Policies/ | manage: admin, manager. apply at POS: cashier. |
| CouponPolicy | Modules/GiftCard/Policies/ | manage: admin, manager. apply: cashier. |
| ManufacturingRecipePolicy | Modules/Manufacturing/Policies/ | manage: admin, manager, inventory_manager. |
| ManufacturingRunPolicy | Modules/Manufacturing/Policies/ | complete: admin, manager, inventory_manager. |
| AssetPolicy | Modules/AssetManagement/Policies/ | manage: admin, manager. view assigned: all roles. |

---

## SECTION 13 — COMPLETE AUDIT EVENT REFERENCE

This section is the master list of all audit events. Every event listed here MUST be implemented. Every service that performs the listed action MUST call AuditService with the correct event name and values.

### Authentication
| Event String | Service | When |
|---|---|---|
| login | AuthService | Successful login |
| login_failed | AuthService | Failed login attempt |
| logout | AuthService | User logs out |
| password_changed | AuthService | User changes own password |
| password_reset | AuthService | Password reset via signed link |

### User Management
| Event String | Service | When |
|---|---|---|
| created | UserService | New user created |
| updated | UserService | User profile edited |
| deleted | UserService | User soft-deleted |
| role_assigned | UserService | Role added or removed |
| status_changed | UserService | User activated or deactivated |
| branch_access_changed | UserService | Admin adds or removes branches from a user's branch_users rows |

### Settings
| Event String | Service | When |
|---|---|---|
| updated | SettingsService | Any setting group saved |

### Products
| Event String | Service | When |
|---|---|---|
| created | ProductService | New product created |
| updated | ProductService | Product details edited |
| deleted | ProductService | Product soft-deleted |
| price_changed | ProductService | selling_price or minimum_selling_price changed |

### Contacts
| Event String | Service | When |
|---|---|---|
| created | CustomerService / SupplierService | New contact created |
| updated | CustomerService / SupplierService | Contact edited |
| deleted | CustomerService / SupplierService | Contact soft-deleted |
| credit_limit_changed | CustomerService | Credit limit updated |

### Inventory
| Event String | Service | When |
|---|---|---|
| stock_adjusted | StockAdjustmentService | Manual adjustment in or out |
| stock_transferred | StockTransferService | Stock moved between warehouses |
| stock_count_started | StockCountService | Count session opened |
| stock_count_completed | StockCountService | Count session finalised |
| lot_status_changed | LotService | Lot recalled, quarantined, or released |
| serial_written_off | SerialService | Serial written off |

### Sales
| Event String | Service | When |
|---|---|---|
| created | SaleService | Sale draft created |
| state_change | SaleService | confirmed / completed / cancelled / returned — one event per transition |
| payment_recorded | PaymentService | Payment added to sale |
| discount_applied | SaleService | Discount applied above zero |
| delivery_status_changed | SaleService | Delivery status updated |
| session_opened | CashRegisterService | Cash register session opened |
| session_closed | CashRegisterService | Cash register session closed |

### Purchases
| Event String | Service | When |
|---|---|---|
| created | PurchaseService | PO created |
| state_change | PurchaseService | PO state changed (received, cancelled) |
| payment_recorded | PaymentService | Payment to supplier |

### Accounting
| Event String | Service | When |
|---|---|---|
| journal_posted | AccountingService | Any journal posted |
| journal_reversed | AccountingService | Journal reversal created |
| coa_created | ChartOfAccountService | New COA account created |
| coa_updated | ChartOfAccountService | COA account edited |
| coa_deleted | ChartOfAccountService | COA account deleted |
| payment_account_transfer | PaymentAccountService | Transfer between payment accounts |

### Expenses
| Event String | Service | When |
|---|---|---|
| created | ExpenseService | Expense recorded |
| updated | ExpenseService | Expense edited |
| deleted | ExpenseService | Expense deleted |

### Commission
| Event String | Service | When |
|---|---|---|
| commission_paid | CommissionService | Commission marked as paid |

### Loyalty
| Event String | Service | When |
|---|---|---|
| points_adjusted | LoyaltyService | Admin manually adjusts customer points |

### HRM Module
| Event String | Service | When |
|---|---|---|
| employee_created | EmployeeService | Employee record created |
| employee_updated | EmployeeService | Employee record edited |
| payroll_finalised | PayrollService | Payroll run finalised |
| leave_approved | LeaveService | Leave request approved |
| leave_rejected | LeaveService | Leave request rejected |

### Manufacturing Module
| Event String | Service | When |
|---|---|---|
| run_completed | ManufacturingService | Production run completed |

### Asset Management Module
| Event String | Service | When |
|---|---|---|
| asset_created | AssetService | Asset registered |
| asset_allocated | AssetService | Asset assigned to a user |
| asset_disposed | AssetService | Asset disposed |

---

*End of Master Build Plan v10*

**Version:** 10.0
**From v9:** Added Branch Data Filter Layer (Section 2.6) — branch_users pivot table (many-to-many), BranchScopeMiddleware loads array of allowed branch IDs, WHERE branch_id IN (...) filter, admin bypass, zero-rows = 403 block, stock transfer cross-branch special rule, branch selector on create forms, branch filter on list pages. Added Audit Layer (Section 2.7) — AuditService, AuditLogJob, Auditable trait, complete audit event catalogue including branch_access_changed. Added AuditLogPage to frontend. Added audit_logs.branch_id column. Added audit event requirements to every Phase in Section 10. Added 3 new absolute rules (29-31). Added Section 13 — Complete Audit Event Reference. Added audit_logs.view to permission matrix.
**Contains:** Project overview, architecture, branch data filter layer (multi-branch per user), audit layer, authorization architecture, full database schema, all business rules with Policy and audit rules, complete API endpoint list, 23-phase build order with Policies and audit events per phase, 31 absolute rules, complete Policy reference, complete Audit Event Reference.
**Does not contain:** Code, implementation details — those are Codex's responsibility.

