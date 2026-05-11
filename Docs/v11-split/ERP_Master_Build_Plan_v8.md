# ERP System — Master Build Plan v8
**Laravel 11 REST API · Vue 3 SPA · Tailwind CSS · MariaDB 10.11**

**Version:** 8.0 (2026)
**Purpose:** Single source of truth for AI-assisted development (Codex). Requirements only — no code.

**Changelog v8 from v7:**
- 9 new core features inspired by Ultimate POS research
- 4 new optional modules added (CRM, GiftCard, Manufacturing, AssetManagement)
- All 7 internal weaknesses from v7 review fixed
- i18n (multi-language) architecture added
- Sales Representative and Commission tracking added to core
- Recurring Sales / Subscriptions added to core
- Gift Cards and Coupons added as Modules/GiftCard/
- CRM with leads, follow-ups, and contact portal added as Modules/CRM/
- Asset Management added as Modules/AssetManagement/
- Manufacturing / Production added as Modules/Manufacturing/
- Delivery status tracking added to sales
- Customer Display Screen support added to POS
- SMS notification channel added alongside email
- Rack / Shelf / Bin location tracking added to inventory
- Custom fields support added to products, customers, and suppliers
- Document upload added to payments, purchases, and contacts
- Sales Target tracking added to core
- Cash register denomination tracking at session close
- Combo product inventory rule now explicitly defined
- Quotation vs invoice number prefix rule defined
- Audit log retention policy added
- Purchase return journal auto-posting rule added
- require_cash_register_session and minimum_selling_price settings added
- 30 reports total (up from 26) — added Sales Rep, Sales Target, Delivery, Recurring Sales reports
- 2 new domain exceptions: MinimumSellingPriceException, MaxDiscountExceededException
- Build phases expanded from 17 to 23 to cover all new modules
- 25 absolute rules (up from 21)

---

## HOW TO USE THIS DOCUMENT

This is the single source of truth for building the ERP system. Written for Codex to read before generating any code.

- Read the relevant section fully before writing code for any feature
- Follow the build order in Section 10 exactly — dependencies are strictly ordered
- Every decision here is intentional — do not deviate without explicit instruction
- NEVER and ALWAYS are absolute — no exceptions
- Section 4 defines what the system must enforce — business rules are not optional
- Section 3 defines column names and types — they are final

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
| Security | Basic roles, integer IDs | UUID keys, BelongsToTenant query scope, rate limiting |
| API | Optional paid module | First-class, fully versioned, Swagger documented |
| Frontend | Server-rendered, slow | Full SPA, instant navigation |
| i18n | Translation-ready | Vue i18n architecture, locale per business |

### System Roles

| Role | Access |
|---|---|
| super_admin | Platform-wide. Not tenant-scoped. |
| admin | Full access to own business. |
| manager | Most features. Cannot edit COA or system settings. |
| cashier | POS and own-shift reports. Max discount enforced. |
| accountant | Journals, COA, payments, financial reports only. |
| inventory_manager | Inventory, products, purchases only. |
| sales_representative | Sales creation and own commission report only. |

### Core Design Philosophy

**Everything is a ledger.** Stock changes, accounting entries, loyalty points, and audit events are written as new rows — never edited. Corrections create reversing entries.

**All data is tenant-scoped.** BelongsToTenant trait adds WHERE business_id = app('tenant')->id to every Eloquent query automatically.

**Services own all business logic.** Controllers receive, validate with Form Requests, call services, return API Resources.

**Modules extend, never modify core.** Optional modules add features without touching any file in app/. Integration through Laravel events and service container bindings.

---

## SECTION 2 — ARCHITECTURE

### Backend — Laravel 11 REST API

Lives in the Laravel root. Exposes /api/v1/. Returns JSON only. Has no knowledge of the frontend.

### Frontend — Vue 3 SPA

Lives in /frontend/ inside the Laravel project. Compiled to /public/build/ for production. Served by a single Laravel catch-all web route returning the one Blade SPA entry point.

### API Versioning

All endpoints under /api/v1/. Non-breaking additions (new optional fields) can go to v1. Breaking changes (removing/renaming fields, changing types) require /api/v2/ and v1 must remain functional for 12 months after v2 launches.

### Backend Layer Structure

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

### Frontend Structure

```
frontend/src/
├── main.js
├── App.vue
├── router/index.js         All routes with auth guard and permission guard
├── i18n/                   Translation files: en.json, km.json, th.json etc.
├── api/                    One file per feature — Axios functions only
├── stores/                 One Pinia store per feature
├── layouts/                AppLayout, AuthLayout, POSLayout
├── components/ui/          Shared stateless UI components
├── components/inventory/   LotSelector, SerialScanner, LotBadge, SerialChip, RackPicker
├── components/sales/       PaymentModal, ReturnModal
├── components/layout/      AppSidebar, AppTopbar, NotificationBell
├── components/reports/     ReportPage shared wrapper
├── composables/            useAuth, useCurrency, useDebounce, useI18n, useToast
└── pages/                  One folder per feature, one Page.vue per page
```

### Layouts

| Layout | Used By | Sidebar | Topbar |
|---|---|---|---|
| AppLayout | All authenticated pages except POS | Yes — fixed | Yes — fixed |
| AuthLayout | Login, Forgot Password, Reset Password | No | No |
| POSLayout | POS page only | No | Slim mini-header |

### Golden Order — Every Feature

Backend first:
1. Migration — columns, indexes, constraints
2. Model — extends BaseModel, relationships, scopes
3. Form Request — input validation
4. API Resource — JSON response shape
5. Repository — database queries with Redis caching
6. Service — all business logic
7. API Controller — receives, delegates, returns. Zero logic.

Frontend second:
8. API file — Axios functions only
9. Pinia Store — state and actions
10. Page Component — store actions only. No direct API calls.
11. Tests — PHPUnit unit tests + feature tests

### i18n Architecture

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
Columns: id, business_id (INDEX), category_id (FK, nullable, INDEX), brand_id (FK, nullable, INDEX), unit_id (FK, INDEX), sub_unit_id (FK, nullable), tax_rate_id (FK, nullable), rack_location_id (FK → rack_locations, nullable, INDEX), name, description (TEXT), sku (UNIQUE per business), barcode (UNIQUE per business if set), barcode_type (ENUM: C128/EAN13/QR, default C128), type (ENUM: single/variable/service/combo), stock_tracking (ENUM: none/lot/serial), has_expiry (TINYINT, default 0), selling_price (DECIMAL 15,4), purchase_price (DECIMAL 15,4), minimum_selling_price (DECIMAL 15,4, default 0 — 0 means no minimum), profit_margin (DECIMAL 5,2), tax_type (ENUM: inclusive/exclusive, default exclusive), track_inventory (TINYINT, default 1), alert_quantity (DECIMAL 15,4), max_stock_level (DECIMAL 15,4), is_for_selling (TINYINT, default 1), is_active (TINYINT, default 1), weight (DECIMAL 8,3), image_url, custom_fields (JSON), created_by (INDEX), created_at, updated_at, deleted_at.
Unique: (business_id, sku). Indexes: (business_id, category_id, is_active), (business_id, stock_tracking). FULLTEXT: (name, sku, barcode).

Combo rule: always track_inventory=false and stock_tracking=none. The combo itself has no stock. Selling a combo creates combo_deduction movements for each component individually.

**product_variations**: id, business_id (INDEX), product_id (FK, INDEX), name (VARCHAR 255), variation_value_ids (JSON), sku (UNIQUE per business), barcode, selling_price (DECIMAL 15,4), purchase_price (DECIMAL 15,4), minimum_selling_price (DECIMAL 15,4, default 0), is_active (TINYINT), created_at, updated_at, deleted_at.

**combo_items**: id, product_id (FK — combo parent, INDEX), child_product_id (FK — component, INDEX), child_variation_id (FK, nullable), quantity (DECIMAL 15,4), created_at, updated_at.

**price_groups**: id, business_id (INDEX), name, description, is_default (TINYINT, one per business), created_at, updated_at, deleted_at.

**price_group_prices**: id, business_id (INDEX), price_group_id (FK, INDEX), product_id (FK, INDEX), variation_id (FK, nullable), price (DECIMAL 15,4). Unique: (price_group_id, product_id, variation_id).

---

### GROUP E — INVENTORY (6 tables)

Critical: stock is NEVER modified directly. Always through StockMovementService.

**stock_movements** — append-only.
Columns: id, business_id (INDEX), product_id (FK, INDEX), variation_id (FK, nullable), warehouse_id (FK, INDEX), lot_id (FK → stock_lots, nullable, INDEX), serial_id (FK → stock_serials, nullable, INDEX), type (ENUM: opening_stock/purchase_receipt/sale/sale_return/purchase_return/adjustment_in/adjustment_out/transfer_in/transfer_out/combo_deduction/stock_count_correction/manufacturing_in/manufacturing_out), quantity (DECIMAL 15,4 — always positive), unit_cost (DECIMAL 15,4), reference_type (VARCHAR 100), reference_id (CHAR 36), notes, created_by (INDEX), created_at (NO updated_at).
Indexes: (business_id, created_at), (product_id, warehouse_id, created_at), (reference_type, reference_id), (lot_id), (serial_id).

**stock_levels**: id, business_id (INDEX), product_id (FK, INDEX), variation_id (FK, nullable), warehouse_id (FK, INDEX), quantity (DECIMAL 15,4), reserved_quantity (DECIMAL 15,4), available_qty (DECIMAL 15,4 — GENERATED STORED: quantity - reserved_quantity), updated_at.
Unique: (product_id, variation_id, warehouse_id).

**stock_lots**: id, business_id (INDEX), product_id (FK, INDEX), variation_id (FK, nullable), warehouse_id (FK, INDEX), supplier_id (FK, nullable, INDEX), lot_number (VARCHAR 100), manufacture_date (DATE, nullable), expiry_date (DATE, nullable), received_at (TIMESTAMP), unit_cost (DECIMAL 15,4), qty_received (DECIMAL 15,4), qty_on_hand (DECIMAL 15,4), qty_reserved (DECIMAL 15,4, default 0), qty_available (DECIMAL 15,4 — GENERATED STORED: qty_on_hand - qty_reserved), status (ENUM: active/depleted/expired/recalled/quarantine), notes, created_by, created_at, updated_at.
Unique: (business_id, lot_number). Indexes: (product_id, warehouse_id, status), (product_id, warehouse_id, received_at), (product_id, warehouse_id, expiry_date), (business_id, expiry_date).

Lot transitions: active→depleted (auto, qty=0), active→expired (auto, daily job), active→recalled (manual), active→quarantine (manual), quarantine→active (manual), quarantine→recalled (manual). No others.

**stock_serials**: id, business_id (INDEX), product_id (FK, INDEX), variation_id (FK, nullable), warehouse_id (FK, nullable, INDEX), supplier_id (FK, nullable), serial_number (VARCHAR 200), status (ENUM: in_stock/sold/returned/transferred/written_off/reserved), purchase_item_id (FK, nullable), sale_item_id (FK, nullable), unit_cost (DECIMAL 15,4), warranty_expires (DATE, nullable), received_at (TIMESTAMP), sold_at (TIMESTAMP, nullable), notes, created_by, created_at, updated_at.
Unique: (business_id, serial_number). Indexes: (product_id, warehouse_id, status), (business_id, status).

Serial transitions: in_stock→reserved (confirm), reserved→sold (complete), reserved→in_stock (cancel), sold→returned (return), returned→in_stock (re-stock), in_stock→transferred (transfer), in_stock→written_off (write-off). No others.

**stock_counts**: id, business_id (INDEX), warehouse_id (FK, INDEX), reference_no (auto SC-YYYY-00001), status (ENUM: in_progress/completed/cancelled), date (DATE), notes, created_by, completed_by (nullable), created_at, updated_at, deleted_at.

**stock_count_items**: id, stock_count_id (FK, INDEX), product_id (FK, INDEX), variation_id (FK, nullable), lot_id (FK, nullable), system_quantity (DECIMAL 15,4), counted_quantity (DECIMAL 15,4, nullable), difference (DECIMAL 15,4 — GENERATED STORED: counted_quantity - system_quantity), unit_cost.

Child table stock_count_serials: id, stock_count_id (FK, INDEX), serial_id (FK, INDEX), found (TINYINT 1).

---

### GROUP F — SALES (11 tables)

**sales**
Columns: id, business_id (INDEX), branch_id (FK, INDEX), warehouse_id (FK, INDEX), customer_id (FK, nullable, INDEX), cash_register_session_id (FK, nullable), commission_agent_id (FK → users, nullable, INDEX), parent_sale_id (FK → sales, nullable — links to original for recurring), created_by (INDEX), sale_number (VARCHAR 50), type (ENUM: pos_sale/invoice/draft/quotation/suspended), status (ENUM: draft/quotation/suspended/confirmed/completed/cancelled/returned), payment_status (ENUM: unpaid/partial/paid), delivery_status (ENUM: pending/dispatched/delivered/returned, nullable), is_recurring (TINYINT, default 0), recurring_interval (ENUM: daily/weekly/monthly, nullable), next_recurring_date (DATE, nullable), recurring_count (SMALLINT, nullable — null = unlimited), recurring_generated (SMALLINT, default 0), sale_date (DATE), due_date (DATE, nullable), subtotal (DECIMAL 15,2), discount_type (ENUM: fixed/percentage, nullable), discount_amount (DECIMAL 15,2, default 0), tax_amount (DECIMAL 15,2), shipping_charges (DECIMAL 15,2, default 0), total_amount (DECIMAL 15,2), paid_amount (DECIMAL 15,2, default 0), change_amount (DECIMAL 15,2), price_group_id (FK, nullable), notes, staff_note, created_at, updated_at, deleted_at.
Indexes: (business_id, status, created_at), (business_id, payment_status, due_date), (business_id, customer_id, created_at).

Sale number rule: type=quotation uses quotation_prefix setting (default QT → QT-YYYY-00001). All other types use invoice prefix setting (default INV → INV-YYYY-00001). Each prefix has its own sequential counter per business.

**sale_items**: id, sale_id (FK, INDEX), product_id (FK, INDEX), variation_id (FK, nullable), sub_unit_id (FK, nullable), quantity (DECIMAL 15,4), unit_price (DECIMAL 15,4 — snapshot), discount_type, discount_amount (DECIMAL 15,2), tax_rate (DECIMAL 5,2 — snapshot), tax_type, tax_amount (DECIMAL 15,2), unit_cost (DECIMAL 15,4 — snapshot for COGS), total_amount (DECIMAL 15,2), notes, created_at, updated_at.

**sale_item_lots**: id, sale_item_id (FK, INDEX), lot_id (FK, INDEX), quantity (DECIMAL 15,4), unit_cost (DECIMAL 15,4 — snapshot).

**sale_item_serials**: id, sale_item_id (FK, INDEX), serial_id (FK, INDEX), created_at. Unique: (sale_item_id, serial_id).

**sale_payments**: id, business_id (INDEX), sale_id (FK, INDEX), payment_account_id (FK, INDEX), amount (DECIMAL 15,2), method (ENUM: cash/card/bank_transfer/cheque/reward_points/gift_card/other), gift_card_id (FK → gift_cards, nullable), reference, payment_date (DATE), note, created_by, created_at, updated_at.

**sale_returns**: id, business_id (INDEX), sale_id (FK, INDEX), branch_id (FK), warehouse_id (FK), return_number (auto RET-YYYY-00001), status (ENUM: draft/completed), return_date (DATE), total_amount (DECIMAL 15,2), refund_method (ENUM: cash/credit_note/bank_transfer/reward_points), notes, created_by, created_at, updated_at, deleted_at.

**sale_return_items**: id, sale_return_id (FK, INDEX), sale_item_id (FK, INDEX), product_id, variation_id (nullable), quantity (DECIMAL 15,4), unit_price (DECIMAL 15,4), unit_cost (DECIMAL 15,4), total_amount (DECIMAL 15,2), lot_id (FK, nullable), serial_ids (JSON).

**cash_registers**: id, business_id (INDEX), branch_id (FK, INDEX), name, is_active (default 1), created_at, updated_at, deleted_at.

**cash_register_sessions**: id, cash_register_id (FK, INDEX), user_id (FK, INDEX), opening_float (DECIMAL 15,2), closing_float (DECIMAL 15,2, nullable), denominations_at_close (JSON — breakdown of notes and coins counted at close), total_sales (DECIMAL 15,2 — computed from sale_payments), status (ENUM: open/closed), opened_at (TIMESTAMP), closed_at (TIMESTAMP, nullable), notes, created_at, updated_at.

**sale_commissions** — tracks commission per sale per agent.
Columns: id, business_id (INDEX), sale_id (FK, INDEX), user_id (FK — agent, INDEX), commission_percentage (DECIMAL 5,2 — snapshot at sale time), commission_amount (DECIMAL 15,2), payment_status (ENUM: pending/paid), paid_at (TIMESTAMP, nullable), paid_via_expense_id (FK → expenses, nullable), created_at, updated_at.
Index: (user_id, payment_status, created_at).

**sale_targets** — monthly targets per user.
Columns: id, business_id (INDEX), user_id (FK, INDEX), month (TINYINT), year (SMALLINT), target_amount (DECIMAL 15,2), achieved_amount (DECIMAL 15,2 — computed from completed sales for that user+period), created_at, updated_at.
Unique: (business_id, user_id, month, year).

---

### GROUP G — PURCHASES (8 tables)

**purchases**: id, business_id (INDEX), supplier_id (FK, INDEX), branch_id (FK, INDEX), warehouse_id (FK, INDEX), created_by, purchase_number (auto PO-YYYY-00001), status (ENUM: draft/ordered/partial_received/received/cancelled), payment_status (ENUM: unpaid/partial/paid), order_date (DATE), expected_date (DATE), subtotal (DECIMAL 15,2), discount_type, discount_amount (DECIMAL 15,2), tax_amount (DECIMAL 15,2), shipping_charges (DECIMAL 15,2), total_amount (DECIMAL 15,2), paid_amount (DECIMAL 15,2), notes, documents (JSON), created_at, updated_at, deleted_at.

**purchase_items**: id, purchase_id (FK, INDEX), product_id (FK, INDEX), variation_id (nullable), quantity (DECIMAL 15,4), quantity_received (DECIMAL 15,4, default 0), unit_price (DECIMAL 15,4), discount_amount, tax_rate (DECIMAL 5,2), tax_amount, total_amount, created_at, updated_at.

**purchase_receives**: id, purchase_id (FK, INDEX), warehouse_id (FK, INDEX), reference_no (auto GRN-YYYY-00001), received_date (DATE), notes, created_by, created_at, updated_at.

**purchase_receive_items**: id, purchase_receive_id (FK, INDEX), purchase_item_id (FK, INDEX), product_id, variation_id (nullable), quantity_received (DECIMAL 15,4), unit_cost (DECIMAL 15,4), created_at, updated_at.

**purchase_receive_lots**: id, purchase_receive_item_id (FK, INDEX), lot_number (VARCHAR 100), manufacture_date (DATE, nullable), expiry_date (DATE, nullable), quantity (DECIMAL 15,4), unit_cost (DECIMAL 15,4), notes, created_at, updated_at.

**purchase_receive_serials**: id, purchase_receive_item_id (FK, INDEX), serial_number (VARCHAR 200), warranty_expires (DATE, nullable), unit_cost (DECIMAL 15,4), notes, created_at, updated_at.

**purchase_returns**: id, business_id (INDEX), purchase_id (FK, INDEX), return_number, status (ENUM: completed), return_date (DATE), total_amount (DECIMAL 15,2), notes, created_by, created_at, updated_at, deleted_at.

**purchase_return_items**: id, purchase_return_id (FK, INDEX), purchase_item_id (FK, INDEX), product_id, variation_id (nullable), lot_id (FK, nullable), serial_ids (JSON), quantity (DECIMAL 15,4), unit_price (DECIMAL 15,4), total_amount (DECIMAL 15,2).

---

### GROUP H — ACCOUNTING (6 tables)

**payment_accounts**: id, business_id (INDEX), name, account_type (ENUM: cash/bank/other), account_number, bank_name, opening_balance (DECIMAL 15,2), coa_account_id (FK, nullable), is_active (default 1), note, created_at, updated_at, deleted_at.

**account_transactions** — append-only: id, business_id (INDEX), payment_account_id (FK, INDEX), type (ENUM: credit/debit), amount (DECIMAL 15,2), reference_type, reference_id (CHAR 36), transaction_date (DATE), note, created_at (NO updated_at).

**chart_of_accounts**: id, business_id (INDEX), parent_id (self-FK, nullable), code (UNIQUE per business), name, type (ENUM: asset/liability/equity/revenue/expense), sub_type (VARCHAR 50), normal_balance (ENUM: debit/credit), is_system (TINYINT), is_active (default 1), description, created_at, updated_at, deleted_at.

**fiscal_years**: id, business_id (INDEX), name, start_date (DATE), end_date (DATE), status (ENUM: active/closed), closed_at, created_at, updated_at.

**journals** — append-only.
Columns: id, business_id (INDEX), fiscal_year_id (FK, nullable), journal_number, type (ENUM: sale/purchase/payment_in/payment_out/sale_return/purchase_return/expense/manual/reversal/opening/manufacturing), reference_type, reference_id (CHAR 36), description (VARCHAR 500, required), total_amount (DECIMAL 15,2), posted_at, posted_by (FK → users), reversed_by_id (FK → journals, nullable), created_at (NO updated_at).
Indexes: (business_id, type, posted_at), (reference_type, reference_id).

Auto-posting rules:
- Sale completed (cash): DR Cash (1000) / CR Revenue (4000) + DR COGS (5000) / CR Inventory (1200)
- Sale completed (credit): DR AR (1100) / CR Revenue (4000) + DR COGS (5000) / CR Inventory (1200)
- Sale return: DR Sales Returns (4100) / CR Cash or AR depending on refund method
- Purchase received: DR Inventory (1200) / CR AP (2000)
- Purchase return: DR AP (2000) / CR Inventory (1200)
- Customer payment: DR Cash (1000) / CR AR (1100)
- Supplier payment: DR AP (2000) / CR Cash (1000)
- Expense: DR appropriate 6xxx account / CR Cash (1000)
- Payroll finalised: DR Salary (6100) / CR Cash (1000)
- Manufacturing run: DR Inventory finished product / CR Inventory raw materials at cost

**journal_entries** — append-only: id, journal_id (FK, INDEX), account_id (FK, INDEX), type (ENUM: debit/credit), amount (DECIMAL 15,2 — always positive), description, created_at (NO updated_at). Index: (account_id, created_at). Invariant: sum(debit) = sum(credit) before any write.

---

### GROUP I — PAYMENTS AND EXPENSES (3 tables)

**purchase_payments**: id, business_id (INDEX), purchase_id (FK, INDEX), payment_account_id (FK, INDEX), amount (DECIMAL 15,2), method (ENUM: cash/card/bank_transfer/cheque/other), reference, payment_date (DATE), note, documents (JSON), status (ENUM: completed/reversed), created_by, created_at, updated_at.

**expense_categories**: id, business_id (INDEX), name, description, parent_id (self-FK, nullable — sub-categories), created_at, updated_at, deleted_at.

**expenses**: id, business_id (INDEX), branch_id (FK, nullable, INDEX), expense_category_id (FK, INDEX), payment_account_id (FK, INDEX), coa_account_id (FK, INDEX), expense_number (auto), expense_date (DATE), amount (DECIMAL 15,2), tax_amount (DECIMAL 15,2, default 0), total_amount (DECIMAL 15,2), reference, notes, attachment_url, is_recurring (TINYINT, default 0), recurring_interval (ENUM: daily/weekly/monthly, nullable), contact_id (FK — customer or supplier, nullable), created_by, created_at, updated_at, deleted_at.

---

### GROUP J — LOYALTY (2 tables)

**loyalty_settings**: id, business_id (UNIQUE FK), points_per_unit (DECIMAL 10,4), redeem_rate (DECIMAL 10,4), min_redeem_points (INT), expiry_months (TINYINT — 0=never), is_active (TINYINT, default 0), created_at, updated_at.

**loyalty_transactions** — append-only: id, business_id (INDEX), customer_id (FK, INDEX), type (ENUM: earned/redeemed/expired/adjusted), points (INT — negative for deductions), reference_type, reference_id, note, expires_at (DATE, nullable), created_at (NO updated_at). Indexes: (customer_id, created_at), (type, expires_at). Balance = SUM(points). Never stored as column.

---

### GROUP K — NOTIFICATIONS (1 table)

Standard Laravel notifications: id, type, notifiable_type, notifiable_id, data (JSON), read_at, created_at, updated_at.

---

### GROUP L — HRM MODULE (9 tables — Modules/HRM/)

All models extend app/Models/BaseModel.

departments: id, business_id, parent_id (self-FK), name, description, manager_id (FK → employees, nullable), timestamps.

designations: id, business_id, name, timestamps.

employees: id, business_id (INDEX), user_id (FK → users, nullable), branch_id, department_id, designation_id (nullable), employee_code (auto EMP-00001, UNIQUE per business), first_name, last_name, gender (ENUM: male/female/other), date_of_birth, hire_date, job_title, phone, email, address (JSON), status (ENUM: active/on_leave/resigned/terminated), salary_type (ENUM: monthly/hourly/daily), salary_amount (DECIMAL 15,2), bank_account (JSON), emergency_contact (JSON), timestamps, deleted_at.

attendance_records: id, business_id, employee_id (FK), date (DATE), check_in (TIME), check_out (TIME, nullable), break_minutes (SMALLINT), working_hours (DECIMAL 5,2), status (ENUM: present/absent/late/half_day/holiday/on_leave), is_overtime (TINYINT), overtime_hours (DECIMAL 5,2), note, timestamps. Unique: (employee_id, date).

leave_types: id, business_id, name, max_days_per_year (SMALLINT), is_paid (TINYINT), timestamps.

leave_balances: id, business_id, employee_id, leave_type_id, year (SMALLINT), total_days (DECIMAL 5,1), used_days (DECIMAL 5,1), remaining_days (DECIMAL 5,1 — GENERATED STORED). Unique: (employee_id, leave_type_id, year).

leave_requests: id, business_id, employee_id, leave_type_id, start_date, end_date, total_days (DECIMAL 5,1), reason, status (ENUM: pending/approved/rejected/cancelled), approved_by (nullable), approved_at, rejection_reason, timestamps.

payroll_runs: id, business_id, month (TINYINT), year (SMALLINT), status (ENUM: draft/processing/finalized), total_employees, total_gross, total_deductions, total_net, finalized_at, finalized_by, timestamps. Unique: (business_id, month, year).

payroll_items: id, payroll_run_id, employee_id, base_salary, allowances, deductions, overtime_pay, leave_deductions, sales_commission (DECIMAL 15,2, default 0 — from sale_commissions), gross_pay, net_pay, working_days, absent_days, overtime_hours, allowances_detail (JSON), deductions_detail (JSON), timestamps.

---

### GROUP M — INSTALLMENT MODULE (2 tables — Modules/Installment/)

installment_plans: id, business_id (INDEX), payable_type (VARCHAR 100: Sale/Purchase), payable_id (CHAR 36, INDEX), total_amount (DECIMAL 15,2), down_payment (DECIMAL 15,2, default 0), installments_count (TINYINT), frequency (ENUM: weekly/biweekly/monthly/custom), start_date (DATE), notes, status (ENUM: active/completed/cancelled), created_by, created_at, updated_at.

installment_schedules: id, plan_id (FK, INDEX), installment_number (TINYINT), due_date (DATE), amount (DECIMAL 15,2), paid_amount (DECIMAL 15,2, default 0), status (ENUM: pending/paid/overdue/partial), payment_id (CHAR 36, nullable), paid_at, created_at, updated_at. Indexes: (plan_id, due_date), (status, due_date).

Module rule: all payments call core PaymentService. Never write to sale_payments directly.

---

### GROUP N — CRM MODULE (4 tables — Modules/CRM/)

crm_leads: id, business_id (INDEX), assigned_to (FK → users, nullable, INDEX), name, email, phone, company, source (ENUM: website/facebook/google/referral/walk_in/other), life_stage (ENUM: new/qualified/opportunity/proposal/won/lost), status (ENUM: active/inactive), next_follow_up_date (DATE, nullable), notes, created_by, created_at, updated_at, deleted_at.

crm_follow_ups: id, business_id (INDEX), followable_type (VARCHAR 100: CrmLead/Customer/Supplier), followable_id (CHAR 36, INDEX), follow_up_date (DATE), follow_up_type (ENUM: call/email/meeting/other), notes, outcome, next_follow_up_date (DATE, nullable), created_by, created_at, updated_at.

crm_contact_logins: id, business_id (INDEX), contact_type (ENUM: customer/supplier), contact_id (CHAR 36, INDEX), email (UNIQUE), password (hashed), is_active (TINYINT, default 1), last_login_at, created_at, updated_at.

crm_campaigns: id, business_id (INDEX), name, type (ENUM: email/sms), status (ENUM: draft/sent/scheduled), scheduled_at (TIMESTAMP, nullable), recipient_group_id (FK → customer_groups, nullable), message_template (TEXT), sent_count (INT, default 0), created_by, created_at, updated_at.

---

### GROUP O — GIFT CARD MODULE (2 tables — Modules/GiftCard/)

gift_cards: id, business_id (INDEX), code (VARCHAR 50, UNIQUE per business), type (ENUM: fixed/open), amount (DECIMAL 15,2), balance (DECIMAL 15,2), status (ENUM: active/depleted/expired/disabled), expires_at (DATE, nullable), customer_id (FK, nullable), issued_by (FK → users), created_at, updated_at.

coupons: id, business_id (INDEX), code (VARCHAR 50, UNIQUE per business), type (ENUM: percentage/fixed), amount (DECIMAL 15,2), minimum_order_amount (DECIMAL 15,2, default 0), usage_limit (INT, nullable — null=unlimited), used_count (INT, default 0), valid_from (DATE), valid_until (DATE), is_active (TINYINT, default 1), created_by, created_at, updated_at.

---

### GROUP P — MANUFACTURING MODULE (3 tables — Modules/Manufacturing/)

manufacturing_recipes: id, business_id (INDEX), product_id (FK — finished product, INDEX), name, notes, is_active (TINYINT, default 1), created_by, created_at, updated_at, deleted_at.

manufacturing_recipe_items: id, recipe_id (FK, INDEX), product_id (FK — raw material, INDEX), variation_id (FK, nullable), quantity (DECIMAL 15,4), unit_cost (DECIMAL 15,4, nullable), created_at, updated_at.

manufacturing_runs: id, business_id (INDEX), recipe_id (FK, INDEX), warehouse_id (FK, INDEX), run_number (auto MFG-YYYY-00001), quantity_produced (DECIMAL 15,4), status (ENUM: draft/in_progress/completed/cancelled), started_at, completed_at, notes, lot_number (VARCHAR 100, nullable — for lot-tracked finished products), expiry_date (DATE, nullable), total_cost (DECIMAL 15,2), created_by, created_at, updated_at.

Rule: completing a run creates manufacturing_out for each component and manufacturing_in for the finished product, all in one DB::transaction(). Insufficient component stock throws InsufficientStockException before any movement.

---

### GROUP Q — ASSET MANAGEMENT MODULE (3 tables — Modules/AssetManagement/)

asset_categories: id, business_id (INDEX), name, depreciation_method (ENUM: straight_line/declining_balance, nullable), useful_life_years (TINYINT, nullable), created_at, updated_at.

assets: id, business_id (INDEX), asset_category_id (FK, INDEX), assigned_to_user_id (FK → users, nullable, INDEX), name, description, asset_code (UNIQUE per business), purchase_date (DATE), purchase_price (DECIMAL 15,2), current_value (DECIMAL 15,2), warranty_expiry (DATE, nullable), status (ENUM: in_use/in_maintenance/disposed/available), location (VARCHAR 255), notes, image_url, created_by, created_at, updated_at, deleted_at.

asset_maintenances: id, asset_id (FK, INDEX), description, maintenance_date (DATE), cost (DECIMAL 15,2, default 0), status (ENUM: pending/in_progress/completed), completed_at (DATE, nullable), notes, created_by, created_at, updated_at.


---

## SECTION 4 — BUSINESS REQUIREMENTS

### 4.1 — Multi-Tenancy

BelongsToTenant trait adds WHERE business_id = app('tenant')->id to every Eloquent query. TenantResolver middleware loads Business record from user's business_id and binds to app('tenant') on every authenticated request. Suspended or cancelled business returns 403.

### 4.2 — Authentication

Login requires email + password. User and business must both be active. On success: record last_login_at, write audit_log event=login. Rate limit: 5 failures per minute per IP → 429. /auth/me returns user + business + roles + permissions in one call. Password change requires current password first. Forgot password sends signed time-limited link via queue. Logout destroys current token only.

### 4.3 — Roles and Permissions

Seven roles seeded at startup. Permissions: {resource}.{action}. Resources include all core features and all modules. An admin cannot delete themselves or the last admin. Cashier max_discount enforced in SaleService — exceeding it throws MaxDiscountExceededException. Minimum selling price: if sales.minimum_sell_price_enabled and product.minimum_selling_price > 0, SaleService rejects lines below minimum, throwing MinimumSellingPriceException. Tier limits (max_users, max_branches) enforced in middleware — exceeded = 403.

### 4.4 — Settings

Redis-cached indefinitely per business. Cache busts on any write. SettingsService.get(group, key), .set(group, key, value), .getGroup(group). All groups seeded with defaults on new business creation.

### 4.5 — Product and Stock Tracking Rules

Each product has one stock_tracking value (none/lot/serial). Cannot change after stock movements exist.

- None: quantity only.
- Lot: has_expiry auto-set to 1. FIFO/FEFO/manual selection. Lot spanning when one lot insufficient.
- Serial: one serial per unit. Quantity always exactly 1 per movement.
- Service: forces stock_tracking=none, track_inventory=false. Cannot be changed.
- Combo: always track_inventory=false, stock_tracking=none. Selling creates combo_deduction movements per component. If component is lot or serial tracked, cashier must select lots/serials for that component.
- Minimum price: if minimum_selling_price > 0 and setting enabled, SaleService blocks sale lines below minimum.

### 4.6 — Inventory Movement Rules

All changes through StockMovementService. Reserve on confirm (increases reserved_quantity). Deduct on complete (decreases quantity and reserved_quantity). Release on cancel (decreases reserved_quantity). Return restores quantity. Transfer moves stock between warehouses in one transaction — cannot transfer to same warehouse. DB::lockForUpdate() required when reading stock inside a transaction. Manufacturing movements: manufacturing_out decreases components, manufacturing_in increases finished product — all in one DB::transaction().

### 4.7 — Sale State Machine

Valid transitions: draft→confirmed (reserve stock), draft→cancelled, confirmed→completed (deduct stock + post journal + record payment + calculate commission), confirmed→cancelled (release reservation), completed→returned, quotation→converted (creates draft sale), quotation→cancelled, suspended→confirmed, suspended→cancelled. Any other transition throws InvalidStateTransitionException.

SaleService on completeSale: deductStock, postSaleJournal, recordPayments, earnLoyaltyPoints (if active), createCommission (if enabled and agent set), scheduleNextRecurring (if is_recurring).

### 4.8 — Recurring Sales

Enabled by pos.enable_subscriptions setting. A sale can be marked recurring with interval and optional count. RecurringSaleJob runs daily: finds sales where is_recurring=1, status=completed, next_recurring_date=today, and count not exhausted. Creates a new draft sale with same items, increments recurring_generated, recalculates next_recurring_date. New sale references original via parent_sale_id. New sale requires manual confirmation and completion.

### 4.9 — Commission Rules

Enabled by sales.enable_commission. Commission rows created on sale completion only — not on draft or confirm, to prevent commission on cancelled sales. commission_percentage is snapshot from user record at sale time — changing the user's rate does not affect past commissions. Commission payment: admin records as an expense, sets paid_via_expense_id on the commission row. Payroll integration: when HRM module calculates payroll, it reads pending sale_commissions for each employee in that month and includes the total in payroll_item.sales_commission.

### 4.10 — Sales Targets

Monthly targets per user in sale_targets. achieved_amount is computed from completed sales in that user+month. Target progress shown on dashboard for managers. Sales Target Report shows target vs achieved vs percentage per user.

### 4.11 — Purchase Receive Rules

Stock enters only at receive time, not at PO creation. None mode: createMovement(purchase_receipt). Lot mode: find or create stock_lots row matching lot_number+product+warehouse, then createMovement with lot_id. Serial mode: check for duplicate serial_number in this business (throw DuplicateSerialException if exists), create stock_serials row with status=in_stock, then createMovement with serial_id. After receiving: update purchase_item.quantity_received. Update purchase.status to partial_received or received. Post journal: DR Inventory / CR Accounts Payable. Purchase return: DR AP / CR Inventory.

### 4.12 — Accounting Rules

postJournal() validates sum(debit) = sum(credit) before any write. Unbalanced → UnbalancedJournalException, nothing written. Corrections via reverseJournal() only — never edit or delete entries. System accounts (is_system=1) cannot be deleted or renamed. Accounts with entries cannot be deleted.

### 4.13 — Payment Rules

Sale payment: creates sale_payment row, increases sale.paid_amount, recalculates payment_status, posts DR Cash / CR AR. Purchase payment: creates purchase_payment row, decreases balance, posts DR AP / CR Cash. Installment module always calls core PaymentService — never writes directly.

### 4.14 — Gift Cards and Coupons (Modules/GiftCard/)

Gift card used as payment: creates sale_payment with method=gift_card, reduces gift_card.balance. Cannot exceed current balance — split payment covers remainder. Coupon applied to sale: discount applied to total, used_count incremented. Expired coupons and coupons over usage_limit cannot be applied. Coupons cannot be applied to quotations.

### 4.15 — CRM Rules (Modules/CRM/)

Leads have life stages from new through won/lost. Winning a lead creates a Customer in core contacts. Follow-ups logged against leads or existing contacts. Daily CRMFollowUpReminderJob notifies assigned users. Contact portal: crm_contact_login users authenticate separately and can view their own invoices, ledger, and payment history through read-only API endpoints scoped to their contact.

### 4.16 — Manufacturing Rules (Modules/Manufacturing/)

Completing a run: ManufacturingService calls StockMovementService to create manufacturing_out for each component and manufacturing_in for the finished product. All in one DB::transaction(). Insufficient component stock throws InsufficientStockException — nothing is written. AccountingService posts manufacturing journal automatically.

### 4.17 — Asset Management Rules (Modules/AssetManagement/)

Assets tracked with purchase price, current value, assigned user, status, and maintenance log. AssetWarrantyExpiryJob notifies admin when warranty_expiry is within 30 days.

### 4.18 — Loyalty Rules

Enabled by loyalty.is_active setting. Earn on sale completion: points = floor(total × points_per_unit). Create earned loyalty_transaction. Redeem at POS: discount = points × redeem_rate. Verify customer has enough points. Create redeemed loyalty_transaction. Daily LoyaltyPointsExpireJob: finds earned transactions where expires_at < today, creates expired transactions cancelling those points. Balance = SUM(points). Never stored.

### 4.19 — Customer Display Screen

When pos.show_customer_display is true, the POS generates a secondary URL at /customer-display/{register_id}. This public page (no auth required) polls GET /api/v1/customer-display/{register_id} every 2 seconds to display the current cart, totals, and business logo. It updates in real time as the cashier adds items.

### 4.20 — SMS Notifications

When sms.is_active is true, all notification jobs that send email also send SMS. Supported providers: Nexmo, Twilio, and custom REST API. SMS templates configurable per notification type in settings.

### 4.21 — Automated Scheduled Jobs

Core jobs (daily):

| Job | Trigger | Action |
|---|---|---|
| LowStockAlertJob | available_qty <= alert_quantity | Email + SMS to admin |
| LotExpiryAlertJob | lot.expiry_date <= today + alert_days AND active | Email + SMS to admin |
| LotExpiredJob | lot.expiry_date < today AND active | Set status=expired, in-app notification |
| SalePaymentDueJob | sale.due_date approaching AND unpaid | Email + SMS to customer |
| PurchasePaymentDueJob | purchase due AND unpaid | Email to admin |
| QuotationExpiryJob | quotation expiry reached | In-app notification |
| RecurringExpenseJob | expense next due date | Auto-create new expense |
| RecurringSaleJob | sale.next_recurring_date = today | Auto-create new draft sale |
| LoyaltyPointsExpireJob | loyalty_transaction.expires_at < today | Create expired transaction rows |
| AuditLogArchiveJob (monthly) | Records older than retention setting | Delete old audit_logs |

Module jobs:

| Job | Module | Action |
|---|---|---|
| InstallmentOverdueJob | Installment | Set status=overdue, notify admin |
| CRMFollowUpReminderJob | CRM | Notify assigned user of follow-ups due today |
| AssetWarrantyExpiryJob | AssetManagement | Notify admin of assets expiring within 30 days |

### 4.22 — Dashboard and Reports

Dashboard cached in Redis per business with 5-minute TTL. Busted on sale completion or purchase receive.

Metrics: revenue today/month/year, purchases today/month/year, gross profit this month, receivables, payables, cash on hand, low stock count, expiring lots count, top 5 products, last 10 sales, 12-month bar chart, 30-day line chart, current month sales target achievement.

All 30 reports accept date filters. All export to Excel via ?format=xlsx.

1. Sales Report — date, branch, customer, status, payment_status
2. Sales Return Report — date, branch, customer
3. Purchases Report — date, branch, supplier, status
4. Purchase Return Report — date, branch, supplier
5. Sale Payments Report — date, method, cashier, account
6. Purchase Payments Report — date, method, account
7. Stock Report — warehouse, category, mode; lot breakdown for lot products
8. Stock Movement Report — type, product, lot, serial, date
9. Low Stock Report — available_qty <= alert_quantity
10. Stock Value Report — qty × purchase_price and qty × selling_price
11. Lot Report — product, warehouse, status, expiry range, lot number
12. Lot Expiry Report — active lots expiring within N days
13. Serial Number Report — serial search, product, status, warranty expiry
14. Product Sales Report — qty sold, revenue, cost, profit per product
15. Trending Products — top N by qty or revenue
16. Customer Ledger — all transactions + running balance for one customer
17. Supplier Ledger — all transactions + running balance for one supplier
18. Receivables Aging — 0-30, 31-60, 61-90, 90+ day buckets
19. Payables Aging — same buckets for suppliers
20. Expense Report — date, category, branch, contact
21. Cash Register Report — opening float, sales, closing float, discrepancy per session
22. Tax Report — output tax vs input tax by period
23. Profit and Loss — revenue − COGS − expenses = net profit
24. Balance Sheet — assets = liabilities + equity
25. Trial Balance — all COA accounts, debits must equal credits
26. Loyalty Points Report — earned/redeemed/expired/balance per customer
27. Sales Representative Report — volume and commission per agent by period
28. Sales Target Report — target vs achieved vs percentage per user per month
29. Delivery Tracking Report — sales by delivery_status, date, branch
30. Recurring Sales Report — active subscriptions with next dates and generated count

### 4.23 — HRM Module

Same as v7 plus: payroll_item.sales_commission is populated from pending sale_commissions for that user in that month. Creating a payroll run marks those commission rows as paid (sets paid_at and paid_via_expense_id to a generated expense entry for the payroll period).

---

## SECTION 5 — API CONTRACT

Success single: { success: true, message: "OK", data: { record } }
Success paginated: { success: true, data: [...], meta: { current_page, last_page, per_page, total } }
Validation error 422: { success: false, message: "Validation failed.", errors: { field: ["msg"] } }
Business rule error 400: { success: false, message: "Human-readable description." }
Unauthenticated 401: { success: false, message: "Unauthenticated." }
Forbidden 403: { success: false, message: "You do not have permission." }
Not found 404: { success: false, message: "Record not found." }
Server error 500: { success: false, message: "An unexpected error occurred." }

Global exception handler converts all api/* exceptions to JSON. Never HTML.
Auth routes: 5 req/min per IP. All other routes: 300 req/min per user.

---

## SECTION 6 — COMPLETE API ENDPOINT LIST

```
AUTH
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/password
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

USERS
GET/POST/PUT/DELETE /api/v1/users

BUSINESS
GET    /api/v1/business
PUT    /api/v1/business

BRANCHES / WAREHOUSES
GET/POST/PUT/DELETE /api/v1/branches
GET/POST/PUT/DELETE /api/v1/warehouses

SETTINGS
GET    /api/v1/settings/{group}
PUT    /api/v1/settings/{group}

CUSTOM FIELDS
GET/POST/PUT/DELETE /api/v1/custom-field-definitions

TAX
GET/POST/PUT/DELETE /api/v1/tax-rates
GET/POST/PUT/DELETE /api/v1/tax-groups

CONTACTS
GET/POST/PUT/DELETE /api/v1/customers
GET    /api/v1/customers/search
POST   /api/v1/customers/import
GET    /api/v1/customers/{id}/ledger
GET/POST/PUT/DELETE /api/v1/customer-groups
GET/POST/PUT/DELETE /api/v1/suppliers
GET    /api/v1/suppliers/{id}/ledger
POST   /api/v1/suppliers/import

CATALOG
GET/POST/PUT/DELETE /api/v1/products
GET    /api/v1/products/search
POST   /api/v1/products/import
GET    /api/v1/products/{id}/lots
GET    /api/v1/products/{id}/serials
GET/POST/PUT/DELETE /api/v1/categories
GET/POST/PUT/DELETE /api/v1/brands
GET/POST/PUT/DELETE /api/v1/units
GET/POST/PUT/DELETE /api/v1/sub-units
GET/POST/PUT/DELETE /api/v1/variation-templates
GET/POST/PUT/DELETE /api/v1/price-groups
GET/POST/PUT/DELETE /api/v1/rack-locations

INVENTORY
GET    /api/v1/inventory/stock
GET    /api/v1/inventory/stock/low
GET    /api/v1/inventory/movements
POST   /api/v1/inventory/adjustments
POST   /api/v1/inventory/transfers
GET    /api/v1/inventory/lots
GET    /api/v1/inventory/lots/{id}
PUT    /api/v1/inventory/lots/{id}/status
GET    /api/v1/inventory/lots/expiring
GET    /api/v1/inventory/serials
GET    /api/v1/inventory/serials/{id}
PUT    /api/v1/inventory/serials/{id}/write-off
GET/POST /api/v1/inventory/stock-counts
GET/PUT  /api/v1/inventory/stock-counts/{id}
POST   /api/v1/inventory/stock-counts/{id}/complete
POST   /api/v1/inventory/barcode-labels

SALES
GET/POST       /api/v1/sales
GET/PUT/DELETE /api/v1/sales/{id}
POST   /api/v1/sales/{id}/confirm
POST   /api/v1/sales/{id}/complete
POST   /api/v1/sales/{id}/cancel
POST   /api/v1/sales/{id}/return
GET    /api/v1/sales/{id}/invoice
PUT    /api/v1/sales/{id}/delivery-status
POST   /api/v1/sales/pos
GET    /api/v1/sales/recurring
GET/POST/PUT/DELETE /api/v1/quotations
POST   /api/v1/quotations/{id}/convert
GET/POST/PUT/DELETE /api/v1/cash-registers
POST   /api/v1/cash-registers/{id}/open
POST   /api/v1/cash-registers/{id}/close
GET    /api/v1/customer-display/{register_id}
GET/POST/PUT/DELETE /api/v1/sale-targets
GET    /api/v1/commissions
PUT    /api/v1/commissions/{id}/pay

PURCHASES
GET/POST       /api/v1/purchases
GET/PUT/DELETE /api/v1/purchases/{id}
POST   /api/v1/purchases/{id}/send
POST   /api/v1/purchases/{id}/receive
POST   /api/v1/purchases/{id}/cancel
POST   /api/v1/purchases/{id}/return
GET    /api/v1/purchases/{id}/pdf

ACCOUNTING
GET/POST/PUT/DELETE /api/v1/accounting/accounts
GET/POST       /api/v1/accounting/journals
POST   /api/v1/accounting/journals/{id}/reverse
GET/POST/PUT/DELETE /api/v1/payment-accounts
POST   /api/v1/payment-accounts/transfer
GET/POST/PUT   /api/v1/accounting/fiscal-years

PAYMENTS
GET/POST /api/v1/sale-payments
GET/POST /api/v1/purchase-payments

EXPENSES
GET/POST/PUT/DELETE /api/v1/expenses
GET/POST/PUT/DELETE /api/v1/expense-categories

LOYALTY
GET/PUT  /api/v1/loyalty/settings
GET      /api/v1/customers/{id}/loyalty
POST     /api/v1/customers/{id}/loyalty/adjust

NOTIFICATIONS
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PUT    /api/v1/notifications/{id}/read
POST   /api/v1/notifications/read-all

REPORTS (all 30 + export)
GET    /api/v1/reports/dashboard
GET    /api/v1/reports/sales
GET    /api/v1/reports/sales-returns
GET    /api/v1/reports/purchases
GET    /api/v1/reports/purchase-returns
GET    /api/v1/reports/sale-payments
GET    /api/v1/reports/purchase-payments
GET    /api/v1/reports/stock
GET    /api/v1/reports/stock-movements
GET    /api/v1/reports/low-stock
GET    /api/v1/reports/stock-value
GET    /api/v1/reports/lots
GET    /api/v1/reports/lots-expiry
GET    /api/v1/reports/serials
GET    /api/v1/reports/product-sales
GET    /api/v1/reports/trending
GET    /api/v1/reports/customer-ledger/{id}
GET    /api/v1/reports/supplier-ledger/{id}
GET    /api/v1/reports/receivables-aging
GET    /api/v1/reports/payables-aging
GET    /api/v1/reports/expenses
GET    /api/v1/reports/cash-register
GET    /api/v1/reports/tax
GET    /api/v1/reports/profit-loss
GET    /api/v1/reports/balance-sheet
GET    /api/v1/reports/trial-balance
GET    /api/v1/reports/loyalty
GET    /api/v1/reports/sales-representative
GET    /api/v1/reports/sales-targets
GET    /api/v1/reports/delivery
GET    /api/v1/reports/recurring-sales
GET    /api/v1/reports/{name}/export

HRM MODULE
GET/POST/PUT/DELETE /api/v1/hrm/employees
GET/POST/PUT/DELETE /api/v1/hrm/departments
GET/POST/PUT/DELETE /api/v1/hrm/designations
POST   /api/v1/hrm/attendance/checkin
POST   /api/v1/hrm/attendance/checkout
GET    /api/v1/hrm/attendance
GET    /api/v1/hrm/attendance/report/{employee_id}
GET/POST/PUT/DELETE /api/v1/hrm/leave-types
GET/POST /api/v1/hrm/leave-requests
PUT    /api/v1/hrm/leave-requests/{id}/approve
PUT    /api/v1/hrm/leave-requests/{id}/reject
GET    /api/v1/hrm/leave-balances/{employee_id}
POST   /api/v1/hrm/payroll
GET    /api/v1/hrm/payroll
PUT    /api/v1/hrm/payroll/{id}/finalize
GET    /api/v1/hrm/payroll/{id}/export
GET    /api/v1/hrm/payroll/{id}/payslip/{employee_id}

INSTALLMENT MODULE
GET/POST/PUT/DELETE /api/v1/installments/plans
GET    /api/v1/installments/plans/{id}/schedules
POST   /api/v1/installments/plans/{id}/pay/{schedule_id}
PUT    /api/v1/installments/plans/{id}/cancel

CRM MODULE
GET/POST/PUT/DELETE /api/v1/crm/leads
PUT    /api/v1/crm/leads/{id}/convert
GET/POST /api/v1/crm/follow-ups
GET/POST/PUT/DELETE /api/v1/crm/contact-logins
GET/POST/PUT/DELETE /api/v1/crm/campaigns

GIFT CARD MODULE
GET/POST/PUT/DELETE /api/v1/gift-cards
POST   /api/v1/gift-cards/{id}/reload
GET/POST/PUT/DELETE /api/v1/coupons
POST   /api/v1/coupons/{code}/validate

MANUFACTURING MODULE
GET/POST/PUT/DELETE /api/v1/manufacturing/recipes
GET/POST/PUT/DELETE /api/v1/manufacturing/runs
POST   /api/v1/manufacturing/runs/{id}/complete

ASSET MANAGEMENT MODULE
GET/POST/PUT/DELETE /api/v1/assets
GET/POST/PUT/DELETE /api/v1/asset-categories
GET/POST /api/v1/assets/{id}/maintenances
PUT    /api/v1/assets/{id}/allocate
```

---

## SECTION 7 — BASE CLASSES AND SERVICES

### BaseModel

All models extend App\Models\BaseModel except User (extends Authenticatable) and Business (no BelongsToTenant).
BaseModel uses: HasUuid, BelongsToTenant, HasUserTracking, SoftDeletes.

HasUuid: auto-generates UUID v4 before creation. Sets incrementing=false, keyType=string.
BelongsToTenant: global scope WHERE business_id = app('tenant')->id. Auto-sets business_id on creation.
HasUserTracking: auto-sets created_by and updated_by from auth()->id().

### BaseApiController

Methods: success($data, $message, $status), paginated($collection, $resource), error($message, $status).

### BaseRepository

CRUD with Redis caching. Keys always include business_id. Bust cache on every write.

### Domain Exceptions (app/Exceptions/Domain/)

All extend DomainException which extends RuntimeException.

- InsufficientStockException
- InsufficientLotQtyException
- SerialNotFoundException
- SerialAlreadySoldException
- DuplicateSerialException
- InvalidStateTransitionException
- UnbalancedJournalException
- LotExpiredException
- LotRecalledException
- MinimumSellingPriceException — sale line price below product minimum
- MaxDiscountExceededException — discount exceeds user's max_discount

### Critical Services

StockMovementService — only entry point for all stock changes.
AccountingService — only entry point for all journal posting. Validates balance before any write.
SaleService — complete sale state machine. Calls both above plus LoyaltyService and CommissionService.
PurchaseService — complete purchase state machine. Calls both above.
PaymentService — records payments, updates balances, posts journals.
NotificationService — dispatches email and SMS based on business settings.
CommissionService — creates commission rows on sale completion, handles payment marking.

---

## SECTION 8 — FRONTEND ARCHITECTURE RULES

api/*.js — Axios functions only. No state.
stores/*.js — state + actions calling api files. Never import axios directly.
pages/*.vue — call store actions only. Zero direct API calls.
components/ui/*.vue — purely presentational.

Always use RouterLink or router.push() for internal links. Never <a href>.
Vue Router beforeEach guards all protected routes.
On app startup, if token in localStorage call authStore.fetchMe() before rendering.
Shared Axios instance auto-injects token. On 401 clears token and redirects to login.

POS: uses POSLayout. Checks for open session on mount. Forces open-session modal if no session. Lot products show LotSelector in cart. Serial products show SerialScanner in cart. Cannot proceed until all lots allocated and all serials confirmed.

Customer Display: /customer-display/{id} is a public route. Polls GET /api/v1/customer-display/{id} every 2 seconds. No auth required.

i18n: all strings use t('key') from Vue i18n. Language from business.locale setting. Translation files in /frontend/src/i18n/. Adding a language = one new JSON file.

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
HasUuid, BelongsToTenant, HasUserTracking traits. BaseModel, BaseRepository, BaseApiController. All 11 domain exception classes. Global JSON exception handler. TenantResolver middleware. Group A migrations (including locale, commission_percentage, sales_target_amount, custom_field_definitions). Seed 7 roles + all permissions, all setting groups with defaults, 21 COA accounts. Full auth API. Test all 6 auth endpoints before moving on.

**Phase 3 — Frontend Foundation**
Shared Axios instance. Vue Router with all layouts and auth guard. AppSidebar, AppTopbar, NotificationBell. All shared UI components (AppTable, AppModal, AppButton, AppInput, AppSelect, AppTextarea, AppToggle, AppBadge, AppPagination, AppSearchInput, AppCard, AppSpinner, ConfirmDialog, EmptyState). Auth Pinia store. LoginPage, ForgotPasswordPage, ResetPasswordPage.

**Phase 4 — Foundation Features**
Users (with new columns), Branches, Warehouses, Settings (all groups). Custom Field Definitions CRUD. Vue pages for all.

**Phase 5 — Tax and Contacts**
Tax Rates, Tax Groups, Customer Groups, Customers (FULLTEXT + custom_fields + documents), Suppliers. Vue pages.

**Phase 6 — Catalog**
Categories, Brands, Units, Sub-Units, Variation Templates, Price Groups, Rack Locations. Products (all 4 types with minimum_selling_price, rack_location_id, custom_fields). Vue pages.

**Phase 7 — Inventory**
Group E migrations. All inventory models. StockMovementService (all methods including manufacturing_in/manufacturing_out). StockAdjustmentService, StockTransferService, LotService, SerialService, StockCountService, BarcodeService. LotSelector, SerialScanner, RackPicker Vue components. All inventory Vue pages.

**Phase 8 — Accounting (Must finish before Phase 9)**
Group H migrations. AccountingService with all auto-posting including purchase_return and manufacturing. 21 COA accounts seeded on business creation. All accounting API and Vue pages.

**Phase 9 — Sales and POS**
Group F migrations (all 11 tables including sale_commissions, sale_targets, parent_sale_id, delivery_status, recurring columns). SaleService with full state machine + commission + minimum price + delivery + recurring logic. QuotationService with QT prefix. CashRegisterService with denominations. RecurringSaleJob. PDF invoice. Customer display endpoint. All sales Vue pages.

**Phase 10 — Purchases**
Group G migrations (with documents column). PurchaseService with all modes, purchase return, and journal. All purchase Vue pages with mode-aware receive modal.

**Phase 11 — Payments and Expenses**
PaymentService. ExpenseService with sub-categories and contact-linked expenses. Vue pages.

**Phase 12 — Commission and Sales Targets**
CommissionService, SaleTargetService. Reports 27 and 28. Commission Vue page, Sales Target Vue page.

**Phase 13 — Loyalty**
LoyaltyService. Integration in POS payment flow. LoyaltyPointsExpireJob. Loyalty Vue page. Report 26.

**Phase 14 — Reports and Dashboard**
DashboardService with Redis caching (including target achievement). ReportService with all 30 reports and Excel export. All 30 report Vue pages. ReportsHubPage.

**Phase 15 — Notifications (Email + SMS)**
NotificationService unified for both channels. All 10 core scheduled jobs. SMS provider integration. Notifications API and Vue page.

**Phase 16 — HRM Module**
9 HRM migrations in Modules/HRM/. All HRM services (PayrollService now includes commission from sale_commissions). All HRM controllers and Vue pages.

**Phase 17 — Installment Module**
2 installment migrations. InstallmentService. InstallmentOverdueJob. InstallmentPage Vue.

**Phase 18 — CRM Module**
4 CRM migrations. CRM services. Contact portal auth flow (separate from core auth). CRMFollowUpReminderJob. All CRM Vue pages.

**Phase 19 — Gift Card Module**
2 gift card migrations. GiftCardService, CouponService. POS integration (method=gift_card). Gift card and coupon Vue pages.

**Phase 20 — Manufacturing Module**
3 manufacturing migrations. ManufacturingService (calls StockMovementService and AccountingService). Manufacturing Vue pages.

**Phase 21 — Asset Management Module**
3 asset migrations. AssetService. AssetWarrantyExpiryJob. Asset Vue pages.

**Phase 22 — Testing and Security**
PHPUnit unit tests for all services — 80%+ coverage target. Priority: StockMovementService (all modes, FIFO/FEFO, lot spanning, expiry/recall blocking, concurrent race condition, manufacturing movements), AccountingService (balance invariant, all auto-posting rules), SaleService (state machine, commission, minimum price, recurring), TenantResolver (cross-tenant isolation). Feature tests: unauthenticated=401, wrong tenant=404, valid=correct DB state, invalid=422. Rate limiting verified. CORS for production domain only. N+1 queries eliminated. File upload validation.

**Phase 23 — Production Deployment**
Ubuntu 22.04. Nginx. PHP 8.2-fpm. MariaDB 10.11 (not Docker). Redis. Supervisor for queue workers. Let's Encrypt SSL. Daily MariaDB backup to S3. GitHub Actions CI/CD. Sentry error monitoring.

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

---

*End of Master Build Plan v8*

**Version:** 8.0
**From v7:** Added 9 core features (commission, recurring sales, delivery tracking, rack locations, custom fields, document uploads, customer display, SMS, sales targets), 4 new modules (CRM, GiftCard, Manufacturing, AssetManagement), fixed all v7 weaknesses, added i18n architecture, 30 reports (up from 26), 25 rules (up from 21), 23 build phases (up from 17).
**Contains:** Project overview, architecture, full database schema, all business rules, complete API endpoint list, 23-phase build order, 25 absolute rules.
**Does not contain:** Code, implementation details — those are Codex's responsibility.
