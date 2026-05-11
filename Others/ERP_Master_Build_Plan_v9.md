# ERP System — Master Build Plan v9
**Laravel 11 REST API · Vue 3 SPA · Tailwind CSS · MariaDB 10.11**

**Version:** 9.0 (2026)
**Purpose:** Single source of truth for AI-assisted development (Codex). Requirements only — no code.

**Changelog v9 from v8:**
- Added complete Policy layer — every resource now has a named Laravel Policy class
- Added Authorization section (Section 2.5) — defines where and how authorization is enforced
- Added Policy rules per feature throughout Section 4
- Added Policy registration requirement to Phase 2 build order
- Added Policy list to every phase in Section 10
- Added 3 new absolute rules (Rules 26, 27, 28) covering authorization
- Clarified that `authorize()` belongs in Controller, never in Service
- Clarified that Route middleware is the first wall, Controller authorize() is the second wall
- Frontend `can()` checks are UI-only — they never replace backend Policy checks
- All 7 roles now have explicit permission lists per resource

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

---

## SECTION 1 — PROJECT OVERVIEW

### What This System Is

A multi-tenant retail ERP system sold commercially to small and medium businesses. One installation serves many businesses simultaneously. Each is completely isolated. The system manages the complete business lifecycle: catalog, inventory (with lot and serial tracking), purchasing, POS sales, invoicing, recurring sales, double-entry accounting, expenses, loyalty, CRM, HR, assets, manufacturing, and 30+ reports.

### Competitive Advantage Over Ultimate POS

| Area | Ultimate POS | This System |
|---|---|---|
| Architecture | Monolithic Blade + jQuery | 100% REST API + Vue 3 SPA |
| Stock tracking | Basic expiry only | Full lot lifecycle + serial number per unit |
| Accounting | Paid add-on, retrofitted | Built-in double-entry, auto-posts every transaction |
| Data integrity | Direct DB updates allowed | Append-only ledgers for stock, accounting, loyalty, audit |
| Security | Basic roles, integer IDs | UUID keys, BelongsToTenant scope, Policies, rate limiting |
| API | Optional paid module | First-class, fully versioned, Swagger documented |
| Frontend | Server-rendered, slow | Full SPA, instant navigation |
| i18n | Translation-ready | Vue i18n architecture, locale per business |

### System Roles

| Role | Access Summary |
|---|---|
| super_admin | Platform-wide. Not tenant-scoped. Full access everywhere. |
| admin | Full access to own business. Cannot delete self or last admin. |
| manager | Most features. Cannot edit COA, system settings, or manage roles. |
| cashier | POS and own-shift reports only. Max discount enforced. |
| accountant | Journals, COA, payments, financial reports only. |
| inventory_manager | Inventory, products, purchases only. |
| sales_representative | Sales creation and own commission report only. |

### Core Design Philosophy

**Everything is a ledger.** Stock changes, accounting entries, loyalty points, and audit events are written as new rows — never edited. Corrections create reversing entries.

**All data is tenant-scoped.** BelongsToTenant trait adds WHERE business_id = app('tenant')->id to every Eloquent query automatically.

**Services own all business logic.** Controllers receive, validate with Form Requests, call services, return API Resources.

**Authorization is enforced at two layers.** Route middleware checks permission strings. Controller Policy checks enforce complex rules (e.g. cannot delete self). Services never check authorization.

**Modules extend, never modify core.** Optional modules add features without touching any file in app/. Integration through Laravel events and service container bindings.

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

#### The Two-Wall Model

Every API request passes through two authorization walls before reaching the Service:

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
Form Request Validation
  → Is the input data valid?
     ↓
Service
  → Business logic only. Zero auth knowledge.
```

#### Layer Responsibilities

| Layer | Question It Answers | Implementation |
|---|---|---|
| Route middleware `auth:sanctum` | Is the user authenticated? | Laravel Sanctum |
| Route middleware `can:permission` | Does the role have this permission? | Spatie Permission |
| Controller `$this->authorize()` | Do complex rules allow this action? | Laravel Policy |
| Form Request | Is the input data valid? | FormRequest class |
| Service | How do we execute this business logic? | Service class |
| Repository | How do we query the database? | Repository class |

#### Where Authorization Lives

```
✅ Route middleware   — permission string check (first wall)
✅ Controller         — Policy check via $this->authorize() (second wall)
❌ Service            — NEVER. Services are auth-blind.
❌ Repository         — NEVER. Repositories are auth-blind.
❌ Model              — NEVER. Models are auth-blind.
```

#### Why Services Must Never Check Authorization

Services are called from multiple contexts:
- HTTP API controllers
- Artisan CLI commands
- Background queue jobs
- Other services and modules
- Scheduled tasks

If authorization lives in the Service, background jobs and CLI commands break. The Service must trust that the caller has already authorized the action.

#### Policy Naming Convention

Every resource model has exactly one Policy class:

| Model | Policy Class | Location |
|---|---|---|
| User | UserPolicy | app/Policies/UserPolicy.php |
| Branch | BranchPolicy | app/Policies/BranchPolicy.php |
| Warehouse | WarehousePolicy | app/Policies/WarehousePolicy.php |
| Product | ProductPolicy | app/Policies/ProductPolicy.php |
| Customer | CustomerPolicy | app/Policies/CustomerPolicy.php |
| Supplier | SupplierPolicy | app/Policies/SupplierPolicy.php |
| Sale | SalePolicy | app/Policies/SalePolicy.php |
| Purchase | PurchasePolicy | app/Policies/PurchasePolicy.php |
| Expense | ExpensePolicy | app/Policies/ExpensePolicy.php |
| Journal | JournalPolicy | app/Policies/JournalPolicy.php |
| ChartOfAccount | ChartOfAccountPolicy | app/Policies/ChartOfAccountPolicy.php |
| Employee (HRM) | EmployeePolicy | Modules/HRM/Policies/EmployeePolicy.php |
| Asset | AssetPolicy | Modules/AssetManagement/Policies/AssetPolicy.php |
| CrmLead | CrmLeadPolicy | Modules/CRM/Policies/CrmLeadPolicy.php |

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

In `app/Providers/AuthServiceProvider.php`, define a Gate::before check so super_admin always returns true without hitting any Policy:

```
Gate::before(function ($user, $ability) {
    if ($user->hasRole('super_admin')) {
        return true;
    }
});
```

This means Policy methods only need to handle the 6 tenant roles (admin, manager, cashier, accountant, inventory_manager, sales_representative).

#### Frontend Authorization

The Vue frontend uses `authStore.can('permission.string')` to show or hide buttons and menu items. This is purely cosmetic — it improves UX but provides zero security. The backend Policy is the only real security layer. Never rely on frontend `can()` checks alone.

### 2.6 Golden Order — Every Feature

Backend first:
1. Migration — columns, indexes, constraints
2. Model — extends BaseModel, relationships, scopes
3. Form Request — input validation
4. API Resource — JSON response shape
5. Repository — database queries with Redis caching
6. Service — all business logic. Zero auth knowledge.
7. Policy — authorization rules for this resource
8. API Controller — receives, delegates, returns. Calls authorize(). Zero business logic.

Frontend second:
9. API file — Axios functions only
10. Pinia Store — state and actions
11. Page Component — store actions only. No direct API calls. Uses can() for UI only.
12. Tests — PHPUnit unit tests + feature tests including 401/403 cases

> Note: Policy is now Step 7, before the Controller. You must write the Policy before the Controller so the Controller can reference it.

### 2.7 i18n Architecture

businesses.locale column (default en). Vue frontend uses Vue i18n with translation files in /frontend/src/i18n/{locale}.json. Backend error messages use Laravel lang/{locale}/. Adding a new language requires only a new JSON file — zero code changes.

---

## SECTION 3 — DATABASE SCHEMA

### Universal Column Rules

| Column | Type | Rule |
|---|---|---|
| id | CHAR(36) PK | UUID auto-generated by HasUuid |
| business_id | CHAR(36) FK | On every table except businesses |
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

**businesses** — tenant root. Does NOT use BelongsToTenant.
Columns: id, name, legal_name, tax_id, email (UNIQUE), phone, currency (CHAR 3, default USD), timezone (default UTC), country (CHAR 2), locale (VARCHAR 10, default en), address (JSON), logo_url, tier (ENUM: basic/standard/enterprise), status (ENUM: active/suspended/cancelled), max_users (INT), max_branches (INT), financial_year (JSON: {start_month}), settings_cache (JSON), created_at, updated_at, deleted_at.
Index: (status, created_at).

**branches**
Columns: id, business_id (INDEX), name, code (auto BR-001, UNIQUE per business), type (ENUM: retail/warehouse/office/online), address (JSON), phone, email, manager_id (FK → users, nullable, INDEX), is_active (default 1), is_default (default 0 — one per business), business_hours (JSON), invoice_settings (JSON), created_at, updated_at, deleted_at.
Unique: (business_id, code).

**warehouses**
Columns: id, business_id (INDEX), branch_id (FK, nullable, INDEX), name, code (auto WH-001, UNIQUE per business), type (ENUM: main/transit/returns/damaged), is_active (default 1), is_default (default 0 — one per business), allow_negative_stock (default 0), created_at, updated_at, deleted_at.
Unique: (business_id, code).

**users**
Columns: id, business_id (INDEX), first_name, last_name, email (UNIQUE), password (always hashed), phone, avatar_url, status (ENUM: active/inactive/suspended), max_discount (DECIMAL 5,2 — 0 = no limit), commission_percentage (DECIMAL 5,2, default 0), sales_target_amount (DECIMAL 15,2, default 0 — monthly target), last_login_at, preferences (JSON), email_verified_at, remember_token, created_at, updated_at, deleted_at.
Indexes: (business_id, status), (business_id, email).

**settings** — key-value config. Redis-cached indefinitely.
Columns: id, business_id (INDEX), group (VARCHAR 50), key (VARCHAR 100), value (TEXT), type (VARCHAR 20: string/integer/boolean/json), is_encrypted (default 0), created_at, updated_at.
Unique: (business_id, key).

Setting groups and keys:
- general: currency, timezone, date_format, decimal_places, locale
- invoice: prefix (INV), quotation_prefix (QT), start_number, show_tax, show_logo, show_previous_due, terms_conditions, footer_note
- pos: default_warehouse_id, allow_discount, max_discount_pct, receipt_printer (browser/thermal), lot_selection_strategy, require_cash_register_session (boolean, default true), show_customer_display (boolean, default false), enable_subscriptions (boolean, default false)
- stock: enable_lot_tracking (boolean), enable_serial_tracking (boolean), lot_expiry_alert_days (integer, default 30), default_lot_selection (fifo/fefo/manual, default fefo), enable_rack_location (boolean, default false)
- email: driver, host, port, username, password, from_address, from_name
- sms: provider (ENUM: nexmo/twilio/custom), api_key, api_secret, from_number, is_active (boolean, default false)
- notifications: low_stock_threshold, payment_due_reminder_days, lot_expiry_alert_days
- loyalty: is_active (boolean, default false)
- sales: enable_commission (boolean, default false), commission_type (ENUM: invoice_value/payment_received), minimum_sell_price_enabled (boolean, default false), delivery_tracking_enabled (boolean, default false)
- system: audit_log_retention_months (integer, default 24), default_page_entries (integer, default 25)

**audit_logs** — append-only.
Columns: id, business_id (INDEX), user_id (FK, nullable, INDEX), event (VARCHAR 50: created/updated/deleted/login/logout/state_change), auditable_type (VARCHAR 100), auditable_id (CHAR 36), old_values (JSON), new_values (JSON), ip_address, user_agent, created_at (NO updated_at).
Indexes: (business_id, created_at), (auditable_type, auditable_id).
Retention: monthly AuditLogArchiveJob deletes records older than system.audit_log_retention_months.

**custom_field_definitions** — user-defined fields for products, customers, suppliers.
Columns: id, business_id (INDEX), module (ENUM: product/customer/supplier), field_name (VARCHAR 100), field_label (VARCHAR 150), field_type (ENUM: text/number/date/select/checkbox), options (JSON — for select type), is_required (TINYINT, default 0), sort_order (SMALLINT, default 0), created_at, updated_at.
Custom field values are stored in custom_fields (JSON) column on the relevant model.

---

### GROUP B — TAX (3 tables)

**tax_rates**: id, business_id (INDEX), name, rate (DECIMAL 5,2), type (ENUM: percentage/fixed), is_default (one per business), is_active (default 1), created_at, updated_at, deleted_at.

**tax_groups**: id, business_id (INDEX), name, description, is_active (default 1), created_at, updated_at, deleted_at.

**tax_group_items**: id, tax_group_id (FK, INDEX), tax_rate_id (FK, INDEX). Unique: (tax_group_id, tax_rate_id). No timestamps. No soft delete.

---

### GROUP C — CONTACTS (3 tables)

**customer_groups**: id, business_id (INDEX), name, discount (DECIMAL 5,2), price_group_id (FK, nullable), created_at, updated_at, deleted_at.

**customers** — FULLTEXT indexed. Balance and points are computed, never stored.
Columns: id, business_id (INDEX), customer_group_id (FK, nullable, INDEX), code (auto CUST-00001, UNIQUE per business), name, type (ENUM: individual/company), email, phone, mobile, tax_id, date_of_birth (DATE), address (JSON), credit_limit (DECIMAL 15,2, default 0), pay_term (SMALLINT), opening_balance (DECIMAL 15,2, default 0), status (ENUM: active/inactive), notes, custom_fields (JSON), documents (JSON — list of uploaded document URLs), created_by (INDEX), created_at, updated_at, deleted_at.
Unique: (business_id, code). Indexes: (business_id, status), (business_id, phone). FULLTEXT: (name, email, phone, mobile).

**suppliers**
Columns: id, business_id (INDEX), code (auto SUPP-00001, UNIQUE per business), name, company, email, phone, mobile, tax_id, address (JSON), pay_term (SMALLINT), opening_balance (DECIMAL 15,2, default 0), status (ENUM: active/inactive), notes, custom_fields (JSON), documents (JSON), created_by (INDEX), created_at, updated_at, deleted_at.
Unique: (business_id, code).

---

### GROUP D — CATALOG (13 tables)

**product_categories**: id, business_id (INDEX), parent_id (self-FK, nullable, INDEX), name, code, short_code (VARCHAR 10), image_url, sort_order (SMALLINT, default 0), created_at, updated_at, deleted_at. Unique: (business_id, name). Max 2 levels deep.

**brands**: id, business_id (INDEX), name, description, image_url, created_at, updated_at, deleted_at. Unique: (business_id, name).

**units**: id, business_id (INDEX), name, short_name, allow_decimal (TINYINT), created_at, updated_at, deleted_at.

**sub_units**: id, business_id (INDEX), parent_unit_id (FK → units, INDEX), name, short_name, conversion_factor (DECIMAL 10,4), created_at, updated_at, deleted_at.

**variation_templates**: id, business_id (INDEX), name, created_at, updated_at, deleted_at.

**variation_values**: id, variation_template_id (FK, INDEX), name, sort_order (SMALLINT, default 0), created_at, updated_at, deleted_at.

**rack_locations** — optional shelf/bin positions within a warehouse.
Columns: id, business_id (INDEX), warehouse_id (FK, INDEX), name (VARCHAR 100), code (VARCHAR 50, UNIQUE per warehouse), description, created_at, updated_at, deleted_at.
Unique: (warehouse_id, code). Only active when stock.enable_rack_location is true.

**products** — FULLTEXT indexed.
Columns: id, business_id (INDEX), category_id, brand_id, unit_id, sub_unit_id, tax_rate_id, rack_location_id, name, description (TEXT), sku (UNIQUE per business), barcode, barcode_type (ENUM: C128/EAN13/QR), type (ENUM: single/variable/service/combo), stock_tracking (ENUM: none/lot/serial), has_expiry (TINYINT, default 0), selling_price (DECIMAL 15,4), purchase_price (DECIMAL 15,4), minimum_selling_price (DECIMAL 15,4, default 0), profit_margin (DECIMAL 5,2), tax_type (ENUM: inclusive/exclusive), track_inventory (TINYINT, default 1), alert_quantity (DECIMAL 15,4), max_stock_level (DECIMAL 15,4), is_for_selling (TINYINT), is_active (TINYINT), weight (DECIMAL 8,3), image_url, custom_fields (JSON), created_by (INDEX), created_at, updated_at, deleted_at.
Unique: (business_id, sku). FULLTEXT: (name, sku, barcode).

**product_variations**: id, business_id (INDEX), product_id, name, variation_value_ids (JSON), sku (UNIQUE per business), barcode, selling_price, purchase_price, minimum_selling_price, is_active, created_at, updated_at, deleted_at.

**combo_items**: id, product_id (FK — combo parent), child_product_id, child_variation_id (nullable), quantity (DECIMAL 15,4), created_at, updated_at.

**price_groups**: id, business_id (INDEX), name, description, is_default (TINYINT, one per business), created_at, updated_at, deleted_at.

**price_group_prices**: id, business_id (INDEX), price_group_id, product_id, variation_id (nullable), price (DECIMAL 15,4). Unique: (price_group_id, product_id, variation_id).

---

### GROUP E — INVENTORY (6 tables)

Critical: stock is NEVER modified directly. Always through StockMovementService.

**stock_movements** — append-only.
Columns: id, business_id (INDEX), product_id, variation_id (nullable), warehouse_id, lot_id (nullable), serial_id (nullable), type (ENUM: opening_stock/purchase_receipt/sale/sale_return/purchase_return/adjustment_in/adjustment_out/transfer_in/transfer_out/combo_deduction/stock_count_correction/manufacturing_in/manufacturing_out), quantity (DECIMAL 15,4 — always positive), unit_cost (DECIMAL 15,4), reference_type (VARCHAR 100), reference_id (CHAR 36), notes, created_by, created_at (NO updated_at).

**stock_levels**: id, business_id, product_id, variation_id (nullable), warehouse_id, quantity (DECIMAL 15,4), reserved_quantity (DECIMAL 15,4), available_qty (GENERATED STORED: quantity - reserved_quantity), updated_at.
Unique: (product_id, variation_id, warehouse_id).

**stock_lots**: id, business_id, product_id, variation_id (nullable), warehouse_id, supplier_id (nullable), lot_number (VARCHAR 100), manufacture_date (DATE, nullable), expiry_date (DATE, nullable), received_at (TIMESTAMP), unit_cost, qty_received, qty_on_hand, qty_reserved (default 0), qty_available (GENERATED STORED: qty_on_hand - qty_reserved), status (ENUM: active/depleted/expired/recalled/quarantine), notes, created_by, created_at, updated_at.
Unique: (business_id, lot_number).

**stock_serials**: id, business_id, product_id, variation_id (nullable), warehouse_id (nullable), supplier_id (nullable), serial_number (VARCHAR 200), status (ENUM: in_stock/sold/returned/transferred/written_off/reserved), purchase_item_id (nullable), sale_item_id (nullable), unit_cost, warranty_expires (DATE, nullable), received_at, sold_at (nullable), notes, created_by, created_at, updated_at.
Unique: (business_id, serial_number).

**stock_counts**: id, business_id, warehouse_id, reference_no (auto SC-YYYY-00001), status (ENUM: in_progress/completed/cancelled), date (DATE), notes, created_by, completed_by (nullable), created_at, updated_at, deleted_at.

**stock_count_items**: id, stock_count_id, product_id, variation_id (nullable), lot_id (nullable), system_quantity, counted_quantity (nullable), difference (GENERATED STORED: counted_quantity - system_quantity), unit_cost.

---

### GROUP F — SALES (11 tables)

**sales**: id, business_id, branch_id, warehouse_id, customer_id (nullable), cash_register_session_id (nullable), commission_agent_id (nullable), parent_sale_id (nullable), created_by, sale_number, type (ENUM: pos_sale/invoice/draft/quotation/suspended), status (ENUM: draft/quotation/suspended/confirmed/completed/cancelled/returned), payment_status (ENUM: unpaid/partial/paid), delivery_status (ENUM: pending/dispatched/delivered/returned, nullable), is_recurring, recurring_interval (nullable), next_recurring_date (nullable), recurring_count (nullable), recurring_generated, sale_date, due_date (nullable), subtotal, discount_type (nullable), discount_amount, tax_amount, shipping_charges, total_amount, paid_amount, change_amount, price_group_id (nullable), notes, staff_note, created_at, updated_at, deleted_at.

Sale number rule: type=quotation uses QT prefix. All other types use INV prefix. Separate sequential counters per business per prefix.

**sale_items**, **sale_item_lots**, **sale_item_serials**, **sale_payments** (with gift_card_id), **sale_returns**, **sale_return_items**, **cash_registers**, **cash_register_sessions** (with denominations_at_close JSON), **sale_commissions**, **sale_targets** — all as defined in v8.

---

### GROUP G — PURCHASES (8 tables)

**purchases**, **purchase_items**, **purchase_receives**, **purchase_receive_items**, **purchase_receive_lots**, **purchase_receive_serials**, **purchase_returns**, **purchase_return_items** — all as defined in v8.

---

### GROUP H — ACCOUNTING (6 tables)

**payment_accounts**, **account_transactions** (append-only), **chart_of_accounts**, **fiscal_years**, **journals** (append-only), **journal_entries** (append-only) — all as defined in v8.

Auto-posting rules:
- Sale completed (cash): DR Cash / CR Revenue + DR COGS / CR Inventory
- Sale completed (credit): DR AR / CR Revenue + DR COGS / CR Inventory
- Purchase received: DR Inventory / CR AP
- Purchase return: DR AP / CR Inventory
- Customer payment: DR Cash / CR AR
- Supplier payment: DR AP / CR Cash
- Expense: DR appropriate 6xxx account / CR Cash
- Payroll finalised: DR Salary Expense / CR Cash
- Manufacturing run: DR Inventory finished / CR Inventory raw materials

---

### GROUP I — PAYMENTS AND EXPENSES (3 tables)

**purchase_payments**, **expense_categories**, **expenses** — all as defined in v8.

---

### GROUP J — LOYALTY (2 tables)

**loyalty_settings**, **loyalty_transactions** (append-only) — as defined in v8. Balance = SUM(points). Never stored as column.

---

### GROUP K — NOTIFICATIONS (1 table)

Standard Laravel notifications table.

---

### GROUPS L through Q — Modules

HRM (9 tables), Installment (2 tables), CRM (4 tables), GiftCard (2 tables), Manufacturing (3 tables), AssetManagement (3 tables) — all as defined in v8. All module models extend app/Models/BaseModel.

---

## SECTION 4 — BUSINESS REQUIREMENTS AND AUTHORIZATION RULES

### 4.1 — Multi-Tenancy

BelongsToTenant adds WHERE business_id = app('tenant')->id to every query. TenantResolver middleware binds tenant on every authenticated request. Suspended or cancelled business returns 403.

### 4.2 — Authentication

Login requires email + password. User AND business must both be active. On success: record last_login_at, write audit_log. Rate limit: 5 failures per minute per IP → 429. /auth/me returns user + business + roles + permissions. Forgot password sends signed time-limited link via queue. Logout destroys current token only.

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
| hrm.view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| hrm.manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| hrm.payroll | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

#### Policy Rules Per Resource

**UserPolicy:**
- `viewAny`: admin, manager only
- `view`: admin, manager — cannot view users from other businesses
- `create`: admin only
- `update`: admin only — cannot edit own role (prevent privilege escalation)
- `delete`: admin only — cannot delete self — cannot delete last admin in business

**BranchPolicy:**
- `viewAny`, `view`: admin, manager
- `create`, `update`: admin only
- `delete`: admin only — cannot delete if branch has associated sales, purchases, or employees

**WarehousePolicy:**
- `viewAny`, `view`: admin, manager, inventory_manager
- `create`, `update`: admin only
- `delete`: admin only — cannot delete if warehouse has any stock movements

**ProductPolicy:**
- `viewAny`, `view`: all roles except accountant
- `create`, `update`: admin, manager, inventory_manager
- `delete`: admin only — cannot delete if product has any stock movements

**CustomerPolicy:**
- `viewAny`, `view`: admin, manager, cashier, sales_representative
- `create`: admin, manager, cashier, sales_representative
- `update`: admin, manager, sales_representative — cashier cannot edit
- `delete`: admin, manager only

**SupplierPolicy:**
- `viewAny`, `view`: admin, manager, accountant, inventory_manager
- `create`, `update`: admin, manager, inventory_manager
- `delete`: admin only

**SalePolicy:**
- `viewAny`, `view`: admin, manager, cashier, accountant, sales_representative
- `create`: admin, manager, cashier, sales_representative
- `update`: admin, manager, sales_representative — only while status is draft
- `delete`: admin only — only while status is draft
- `confirm`: admin, manager, cashier, sales_representative
- `complete`: admin, manager, cashier, sales_representative
- `cancel`: admin, manager only
- `return`: admin, manager only
- `viewOwn`: sales_representative sees only sales where commission_agent_id = self

**PurchasePolicy:**
- `viewAny`, `view`: admin, manager, accountant, inventory_manager
- `create`, `update`: admin, manager, inventory_manager
- `delete`: admin only — only while status is draft
- `receive`: admin, manager, inventory_manager
- `return`: admin, manager, inventory_manager

**InventoryPolicy (stock adjustments, transfers, counts):**
- All actions: admin, manager, inventory_manager only
- Cashier and sales_representative have zero inventory access

**JournalPolicy:**
- `viewAny`, `view`: admin, accountant
- `create` (manual entry): admin, accountant
- `reverse`: admin, accountant

**ChartOfAccountPolicy:**
- `viewAny`, `view`: admin, manager, accountant
- `create`, `update`: admin, accountant
- `delete`: admin, accountant — cannot delete system accounts (is_system=1) — cannot delete accounts with journal entries

**ExpensePolicy:**
- `viewAny`, `view`: admin, manager, accountant
- `create`, `update`: admin, manager, accountant
- `delete`: admin only

**ReportPolicy:**
- Financial reports (P&L, Balance Sheet, Trial Balance): admin, accountant
- Commission/target reports: admin, manager, sales_representative sees own only
- All other reports: admin, manager, cashier (own shift), inventory_manager, accountant

### 4.4 — Settings

Redis-cached indefinitely per business. Cache busts on any write. Only admin can read or write settings. SettingsService.get(), .set(), .getGroup() — called from controller after Policy check.

### 4.5 — Product and Stock Tracking Rules

Each product has one stock_tracking value (none/lot/serial). Cannot change after stock movements exist. Service enforces this — ProductPolicy::update() also blocks stock_tracking changes when movements exist.

### 4.6 — Inventory Movement Rules

All changes through StockMovementService. Reserve on confirm, deduct on complete, release on cancel, return restores quantity. DB::lockForUpdate() required when reading stock in transaction. StockMovementService is called by services only — never directly from controllers.

### 4.7 — Sale State Machine

Valid transitions: draft→confirmed, draft→cancelled, confirmed→completed, confirmed→cancelled, completed→returned, quotation→converted, quotation→cancelled, suspended→confirmed, suspended→cancelled. Any other throws InvalidStateTransitionException.

SalePolicy enforces: only admin and manager can cancel a confirmed sale. Only admin and manager can process returns. SaleService enforces the stock and accounting logic.

### 4.8 — Recurring Sales

Enabled by pos.enable_subscriptions setting. RecurringSaleJob runs daily. Creates new draft sale. New sale requires manual confirmation — not auto-completed.

### 4.9 — Commission Rules

Enabled by sales.enable_commission. Commission rows created on sale completion only. commission_percentage is snapshot from user at sale time. Sales representative can only view their own commission report.

### 4.10 — Sales Targets

Monthly targets per user. achieved_amount computed from completed sales. SaleTargetPolicy: admin and manager can create and edit targets. sales_representative can only view their own targets.

### 4.11 — Purchase Receive Rules

Stock enters only at receive time. PurchasePolicy::receive() allows admin, manager, inventory_manager. Serial mode checks for duplicates — throws DuplicateSerialException if found.

### 4.12 — Accounting Rules

postJournal() validates balance before any write. Corrections via reverseJournal() only. System accounts cannot be deleted or renamed — ChartOfAccountPolicy::delete() and ::update() enforce this.

### 4.13 — Payment Rules

PaymentPolicy: admin, manager, accountant, cashier (sale payments at POS only) can record payments. Installment module always calls core PaymentService.

### 4.14 — Gift Cards and Coupons (Modules/GiftCard/)

GiftCardPolicy: admin, manager can create and manage gift cards. cashier can apply them at POS. Expired coupons and over-limit coupons cannot be applied — enforced in GiftCardService and CouponService.

### 4.15 — CRM Rules (Modules/CRM/)

CrmLeadPolicy: admin, manager, sales_representative can view and manage leads. Contact portal uses separate crm_contact_login authentication — completely separate from core user auth.

### 4.16 — Manufacturing Rules (Modules/Manufacturing/)

ManufacturingPolicy: admin, manager, inventory_manager can manage recipes and runs. ManufacturingService calls StockMovementService and AccountingService — never modifies stock directly.

### 4.17 — Asset Management Rules (Modules/AssetManagement/)

AssetPolicy: admin, manager can manage assets. All roles can view assets assigned to them.

### 4.18 — Loyalty Rules

Enabled by loyalty.is_active. Earn on completion. Redeem at POS. Balance = SUM(points) from transactions — never stored as column.

### 4.19 — Customer Display Screen

Public endpoint — no auth required. Polls current open sale on that register every 2 seconds.

### 4.20 — SMS Notifications

When sms.is_active is true, all notification jobs send both email and SMS.

### 4.21 — Automated Scheduled Jobs

Same 10 core jobs as v8. Same 3 module jobs. All registered in routes/console.php scheduler.

### 4.22 — Dashboard and Reports

Dashboard cached per business with 5-minute TTL. All 30 reports accept date filters. All export to Excel. ReportPolicy restricts financial reports to admin and accountant.

### 4.23 — HRM Module

PayrollService reads pending sale_commissions for each employee and includes total in payroll_item.sales_commission. Finalizing payroll marks commission rows as paid.

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

---

## SECTION 6 — COMPLETE API ENDPOINT LIST

All endpoints same as v8. No changes to endpoint list.

```
AUTH — 6 endpoints (no Policy — handled by AuthService directly)
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
PUT  /api/v1/auth/password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

USERS — UserPolicy
GET/POST/PUT/DELETE /api/v1/users

BRANCHES — BranchPolicy
GET/POST/PUT/DELETE /api/v1/branches

WAREHOUSES — WarehousePolicy
GET/POST/PUT/DELETE /api/v1/warehouses

SETTINGS — SettingsPolicy (admin only for all methods)
GET/PUT /api/v1/settings/{group}

CUSTOM FIELDS — CustomFieldPolicy
GET/POST/PUT/DELETE /api/v1/custom-field-definitions

TAX — TaxRatePolicy, TaxGroupPolicy
GET/POST/PUT/DELETE /api/v1/tax-rates
GET/POST/PUT/DELETE /api/v1/tax-groups

CONTACTS — CustomerPolicy, SupplierPolicy
GET/POST/PUT/DELETE /api/v1/customers
GET/POST/PUT/DELETE /api/v1/suppliers

CATALOG — ProductPolicy, CategoryPolicy
GET/POST/PUT/DELETE /api/v1/products
GET/POST/PUT/DELETE /api/v1/categories
(brands, units, sub-units, variation-templates, price-groups, rack-locations follow same pattern)

INVENTORY — InventoryPolicy
GET    /api/v1/inventory/stock
POST   /api/v1/inventory/adjustments
POST   /api/v1/inventory/transfers
GET/POST /api/v1/inventory/stock-counts
POST   /api/v1/inventory/stock-counts/{id}/complete

SALES — SalePolicy
GET/POST       /api/v1/sales
POST           /api/v1/sales/{id}/confirm
POST           /api/v1/sales/{id}/complete
POST           /api/v1/sales/{id}/cancel
POST           /api/v1/sales/{id}/return
PUT            /api/v1/sales/{id}/delivery-status

PURCHASES — PurchasePolicy
GET/POST       /api/v1/purchases
POST           /api/v1/purchases/{id}/receive
POST           /api/v1/purchases/{id}/return

ACCOUNTING — JournalPolicy, ChartOfAccountPolicy
GET/POST       /api/v1/accounting/journals
POST           /api/v1/accounting/journals/{id}/reverse
GET/POST/PUT/DELETE /api/v1/accounting/accounts

EXPENSES — ExpensePolicy
GET/POST/PUT/DELETE /api/v1/expenses

REPORTS — ReportPolicy
GET /api/v1/reports/dashboard
GET /api/v1/reports/{name}
GET /api/v1/reports/{name}/export

HRM MODULE — EmployeePolicy, PayrollPolicy
(all HRM endpoints)

CRM MODULE — CrmLeadPolicy
(all CRM endpoints)

ASSET MODULE — AssetPolicy
(all asset endpoints)
```

---

## SECTION 7 — BASE CLASSES AND SERVICES

### BaseModel

All models extend App\Models\BaseModel except User (extends Authenticatable) and Business (no BelongsToTenant).
BaseModel uses: HasUuid, BelongsToTenant, HasUserTracking, SoftDeletes.

### BaseApiController

Methods: success(), paginated(), error().
Every controller method calls $this->authorize() BEFORE calling any service.

### BaseRepository

CRUD with Redis caching. Keys always include business_id. Bust cache on every write.

### Domain Exceptions (app/Exceptions/Domain/)

All 11 domain exceptions as defined in v8 — plus authorization exceptions are handled by Laravel's built-in AuthorizationException (converted to 403 by global handler).

### Critical Services — Authorization Reminder

StockMovementService — zero auth knowledge. Called by other services only.
AccountingService — zero auth knowledge. Called by other services only.
SaleService — zero auth knowledge. Validates business rules (min price, max discount) but never checks roles or permissions.
PurchaseService — zero auth knowledge.
PaymentService — zero auth knowledge.
All other services — zero auth knowledge without exception.

---

## SECTION 8 — FRONTEND ARCHITECTURE RULES

api/*.js — Axios functions only. No state.
stores/*.js — state + actions calling api files. Never import axios directly.
pages/*.vue — call store actions only. Zero direct API calls.
components/ui/*.vue — purely presentational.

**Frontend authorization using `can()`:**
The `authStore.can('permission.string')` helper is used to show or hide buttons and nav items. This is purely cosmetic. It never replaces backend Policy checks.

```
// ✅ Correct use of can() — controls UI visibility only
<button v-if="can('users.create')" @click="openCreateModal">
  Add User
</button>

// The button being hidden does NOT prevent a POST /api/v1/users request
// The backend Policy is what truly blocks unauthorized access
```

All other frontend rules same as v8.

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
Docker Compose (MariaDB 10.11, Redis 7, phpMyAdmin, MailHog). Laravel 11. .env configured. Strict SQL mode. Catch-all web route. SPA Blade entry. /frontend with Vite + Vue 3. All npm packages. Tailwind configured. Vite proxy configured. Vue i18n setup with en.json.

**Phase 2 — Backend Foundation (Critical Path)**
HasUuid, BelongsToTenant, HasUserTracking traits. BaseModel, BaseRepository, BaseApiController. All 11 domain exception classes. Global JSON exception handler — must convert AuthorizationException to 403 JSON. TenantResolver middleware. Group A migrations. Seed 7 roles + all permissions from the permission matrix in Section 4.3, all setting groups, 21 COA accounts. Full auth API.
Policies to create: Register Gate::before for super_admin in AuthServiceProvider.
Test: all 6 auth endpoints. Test that a cashier calling POST /api/v1/users returns 403.

**Phase 3 — Frontend Foundation**
Shared Axios instance. Vue Router with all layouts and auth guard. AppSidebar, AppTopbar, NotificationBell. All shared UI components. Auth Pinia store with `can()` and `hasRole()` helpers. LoginPage, ForgotPasswordPage, ResetPasswordPage.

**Phase 4 — Foundation Features**
Users, Branches, Warehouses, Settings, Custom Field Definitions.
Policies to create: UserPolicy, BranchPolicy, WarehousePolicy, SettingsPolicy, CustomFieldPolicy.
Policy rules: UserPolicy — admin cannot delete self, cannot delete last admin. BranchPolicy — cannot delete if has sales or employees. WarehousePolicy — cannot delete if has stock movements.
Vue pages: hide create/edit/delete buttons using can() for UI only.

**Phase 5 — Tax and Contacts**
Tax Rates, Tax Groups, Customer Groups, Customers, Suppliers.
Policies to create: TaxRatePolicy, TaxGroupPolicy, CustomerGroupPolicy, CustomerPolicy, SupplierPolicy.
Policy rules: CustomerPolicy — cashier can view and create but cannot delete. SupplierPolicy — cashier has no access.

**Phase 6 — Catalog**
Categories, Brands, Units, Sub-Units, Variation Templates, Price Groups, Rack Locations, Products.
Policies to create: CategoryPolicy, BrandPolicy, UnitPolicy, PriceGroupPolicy, RackLocationPolicy, ProductPolicy.
Policy rules: ProductPolicy — inventory_manager can create and edit but cannot delete. ProductPolicy::update() blocks stock_tracking field change if movements exist (check inside Policy, throw 403 with clear message).

**Phase 7 — Inventory**
Group E migrations. All inventory models and services. LotSelector, SerialScanner Vue components. All inventory Vue pages.
Policies to create: StockAdjustmentPolicy, StockTransferPolicy, StockCountPolicy, LotPolicy, SerialPolicy.
Policy rules: All inventory actions restricted to admin, manager, inventory_manager. Cashier and sales_representative get 403 on all inventory endpoints.

**Phase 8 — Accounting (Must finish before Phase 9)**
Group H migrations. AccountingService. COA seeding. All accounting Vue pages.
Policies to create: JournalPolicy, ChartOfAccountPolicy, PaymentAccountPolicy, FiscalYearPolicy.
Policy rules: ChartOfAccountPolicy::delete() — block if is_system=1, block if account has journal entries. ChartOfAccountPolicy::update() — block name/type changes if is_system=1. JournalPolicy::delete() — ALWAYS return false (journals are append-only and can never be deleted by anyone).

**Phase 9 — Sales and POS**
Group F migrations. SaleService full state machine. QuotationService. CashRegisterService. All sales Vue pages.
Policies to create: SalePolicy, QuotationPolicy, CashRegisterPolicy, SaleReturnPolicy.
Policy rules: SalePolicy — cashier cannot cancel or return. sales_representative viewOwn scope. SalePolicy::update() blocks editing a completed or cancelled sale for all roles.

**Phase 10 — Purchases**
Group G migrations. PurchaseService. All purchase Vue pages.
Policies to create: PurchasePolicy, PurchaseReturnPolicy.
Policy rules: PurchasePolicy — cashier has zero access. inventory_manager can receive and return but cannot delete.

**Phase 11 — Payments and Expenses**
PaymentService. ExpenseService. Vue pages.
Policies to create: SalePaymentPolicy, PurchasePaymentPolicy, ExpensePolicy.
Policy rules: SalePaymentPolicy — cashier can create sale payments at POS only. ExpensePolicy::delete() — admin only.

**Phase 12 — Commission and Sales Targets**
CommissionService, SaleTargetService.
Policies to create: CommissionPolicy, SaleTargetPolicy.
Policy rules: CommissionPolicy — sales_representative views own commissions only (Policy checks commission.user_id === auth user id). SaleTargetPolicy — sales_representative views own targets only.

**Phase 13 — Loyalty**
LoyaltyService. POS integration. LoyaltyPointsExpireJob.
Policies to create: LoyaltyPolicy.
Policy rules: LoyaltyPolicy — admin and manager manage settings. Cashier can apply redemption at POS only.

**Phase 14 — Reports and Dashboard**
DashboardService. ReportService. All 30 report Vue pages.
Policies to create: ReportPolicy.
Policy rules: ReportPolicy — financial reports (profit_loss, balance_sheet, trial_balance) require accounting.view permission. Commission/target reports: sales_representative filtered to own data only.

**Phase 15 — Notifications**
NotificationService. All 10 core scheduled jobs. SMS integration. Notifications Vue page.
No new Policies — notifications are read by the owner user only (standard Laravel notification scoping).

**Phase 16 — HRM Module**
9 HRM migrations in Modules/HRM/. All HRM services including commission-aware PayrollService.
Policies to create: EmployeePolicy, AttendancePolicy, LeavePolicy, PayrollPolicy (all in Modules/HRM/Policies/).
Policy rules: PayrollPolicy::finalize() — admin and accountant only. PayrollPolicy::delete() — ALWAYS return false (finalized payroll is read-only). EmployeePolicy — manager can view but cannot manage payroll.

**Phase 17 — Installment Module**
2 installment migrations. InstallmentService. InstallmentOverdueJob.
Policies to create: InstallmentPolicy (Modules/Installment/Policies/).
Policy rules: admin, manager, accountant can manage plans. cashier can view plans linked to their sales.

**Phase 18 — CRM Module**
4 CRM migrations. CRM services. Contact portal auth.
Policies to create: CrmLeadPolicy, CrmCampaignPolicy (Modules/CRM/Policies/).
Policy rules: Contact portal users are authenticated via crm_contact_login — they use a completely separate Gate guard, not the main Sanctum guard.

**Phase 19 — Gift Card Module**
2 gift card migrations. GiftCardService, CouponService. POS integration.
Policies to create: GiftCardPolicy, CouponPolicy (Modules/GiftCard/Policies/).
Policy rules: admin, manager can create and manage. cashier can only apply at POS (read balance, apply to sale).

**Phase 20 — Manufacturing Module**
3 manufacturing migrations. ManufacturingService.
Policies to create: ManufacturingRecipePolicy, ManufacturingRunPolicy (Modules/Manufacturing/Policies/).
Policy rules: admin, manager, inventory_manager can manage recipes and runs.

**Phase 21 — Asset Management Module**
3 asset migrations. AssetService. AssetWarrantyExpiryJob.
Policies to create: AssetPolicy, AssetMaintenancePolicy (Modules/AssetManagement/Policies/).
Policy rules: admin, manager can manage all assets. All authenticated users can view assets assigned to them.

**Phase 22 — Testing and Security**
PHPUnit unit tests — 80%+ coverage. Priority services same as v8.
Additional test requirements for v9:
- Every controller endpoint must have a test for 401 (unauthenticated)
- Every controller endpoint must have a test for 403 (authenticated but wrong role)
- Cashier calling POST /api/v1/users → must return 403
- Cashier calling DELETE /api/v1/sales/{id} → must return 403
- sales_representative calling GET /api/v1/commissions → must only see own commissions
- accountant calling DELETE /api/v1/accounting/accounts/{id} where is_system=1 → must return 403
- manager calling DELETE /api/v1/accounting/journals/{id} → must return 403 (journals are append-only)
- inventory_manager calling POST /api/v1/users → must return 403
Rate limiting, CORS, N+1 elimination — same as v8.

**Phase 23 — Production Deployment**
Ubuntu 22.04. Nginx. PHP 8.2-fpm. MariaDB 10.11 (not Docker). Redis. Supervisor. Let's Encrypt SSL. Daily backup to S3. GitHub Actions CI/CD. Sentry error monitoring. Same as v8.

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
| 27 | Every controller method MUST call $this->authorize() before calling any service. | Any role can perform any action if the route middleware is misconfigured. |
| 28 | Frontend can() checks are UI-only cosmetic helpers. Backend Policy is the ONLY real security layer. | Hiding a button is not security. Direct API calls bypass all frontend checks. |

---

## SECTION 12 — COMPLETE POLICY REFERENCE

This section lists every Policy class, its location, and its methods for quick reference during development.

### Core Policies (app/Policies/)

| Policy | Key Rules |
|---|---|
| UserPolicy | create/edit: admin only. delete: admin only, not self, not last admin. |
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
| ReportPolicy | financial reports: admin, accountant only. |

### Module Policies (Modules/{Name}/Policies/)

| Policy | Location | Key Rules |
|---|---|---|
| EmployeePolicy | Modules/HRM/Policies/ | view: admin, manager. manage: admin only. |
| PayrollPolicy | Modules/HRM/Policies/ | finalize: admin, accountant. delete: ALWAYS false. |
| InstallmentPolicy | Modules/Installment/Policies/ | manage: admin, manager, accountant. |
| CrmLeadPolicy | Modules/CRM/Policies/ | manage: admin, manager, sales_rep. convert: admin, manager. |
| GiftCardPolicy | Modules/GiftCard/Policies/ | manage: admin, manager. apply at POS: cashier. |
| CouponPolicy | Modules/GiftCard/Policies/ | manage: admin, manager. apply: cashier. |
| ManufacturingRecipePolicy | Modules/Manufacturing/Policies/ | manage: admin, manager, inventory_manager. |
| ManufacturingRunPolicy | Modules/Manufacturing/Policies/ | complete: admin, manager, inventory_manager. |
| AssetPolicy | Modules/AssetManagement/Policies/ | manage: admin, manager. view assigned: all roles. |

---

*End of Master Build Plan v9*

**Version:** 9.0
**From v8:** Added complete Policy layer (Section 2.5, Section 12), full permission matrix per role (Section 4.3), Policy rules per resource, Policy build steps per phase, 3 new absolute rules (26-28), updated Golden Order to include Policy as Step 7, clarified authorization architecture throughout.
**Contains:** Project overview, architecture, authorization architecture, full database schema, all business rules with Policy rules, complete API endpoint list with Policy references, 23-phase build order with Policies per phase, 28 absolute rules, complete Policy reference.
**Does not contain:** Code, implementation details — those are Codex's responsibility.
