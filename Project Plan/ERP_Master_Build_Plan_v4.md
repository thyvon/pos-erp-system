# ERP System — Master Build Plan v4
**Better Than Ultimate POS | Laravel 11 | MariaDB 10.11 | Vue 3 | REST API**

Version       : 4.0  (2026)
Architecture  : Global layer (app/) for ALL features | Modules/HRM/ only
Database      : MariaDB 10.11 LTS (GENERATED COLUMNS, FULLTEXT, native JSON)
UI Template   : SmartAdmin v4.5.1 (Bootstrap 4.5 — gotbootstrap.com)
Changelog v4  : Added Lot Number and Serial Number tracking system.
               Stock tracking mode is per-product (none | lot | serial),
               enabled via a business-level setting. No restaurant features.


## SECTION 0 — WHY WE ARE BETTER THAN ULTIMATE POS


  Problem in Ultimate POS                 Our Solution
  ------------------------------------    -----------------------------------------
  Monolithic Blade + jQuery               Vue 3 SPA — reactive, no page reloads
  No real REST API                        100% REST under /api/v1/ — mobile-ready
  Basic accounting (not double-entry)     Full double-entry with auto-posting
  Stock updated directly (no ledger)      Append-only stock_movements ledger
  Hardcoded roles                         Spatie Permission — fine-grained
  Business logic in controllers           Service layer — 100% testable
  No test suite                           PHPUnit — 80%+ coverage target
  Slow on large data                      Redis + Octane + MariaDB FULLTEXT indexes
  Sequential integer IDs (guessable)      UUID primary keys everywhere
  No tenant isolation middleware          BelongsToTenant auto-scopes all queries
  MySQL only                              MariaDB 10.11 LTS — faster, free
  Lot/Serial tracking is basic            Dedicated lot + serial tables with full
                                          lifecycle states, FIFO, expiry alerts

Features we add that Ultimate POS does NOT have:
  - Lot number tracking per product (batch groups with qty, expiry, supplier)
  - Serial number tracking per product (one unique record per physical unit)
  - Per-product stock tracking mode: none (qty) | lot | serial
  - FIFO lot selection on POS/invoice sales
  - Serial number state machine: in_stock → sold → returned → transferred → written_off
  - Lot expiry notifications (daily job — X days before expiry)
  - True double-entry accounting journals auto-posted from every transaction
  - Stock reservation system (reserve on confirm, deduct on complete)
  - Full audit log on every record change
  - Installment plans with auto-generated schedules
  - API-first architecture — any mobile app can connect
  - Per-tenant Redis caching with automatic invalidation
  - Proper automated test suite with PHPUnit
  - SmartAdmin 4.5.1 with dark/light mode, responsive layouts


## SECTION 1 — ARCHITECTURE OVERVIEW


LAYER STRUCTURE:

  Layer            Location         Contents
  ---------------  ---------------  -------------------------------------------
  Foundation       app/             Auth, Users, Business, Branches, Warehouses
  Configuration    app/             Settings, Tax Rates, Tax Groups
  Contacts         app/             Customers, Customer Groups, Suppliers
  Catalog          app/             Products, Variants, Brands, Categories,
                                    Units, Sub-Units, Variation Templates,
                                    Combo Items, Price Groups
  Inventory        app/             Stock Movements, Stock Levels,
                                    Stock Lots, Stock Serials,
                                    Stock Count, Barcode Labels
  Sales            app/             Sales, POS, Quotations, Sale Returns,
                                    Cash Register
  Purchases        app/             Purchase Orders, Receives, Returns
  Accounting       app/             Chart of Accounts, Journals, Journal Entries,
                                    Payment Accounts
  Payments         app/             Sale Payments, Purchase Payments,
                                    Installment Plans
  Expenses         app/             Expenses, Expense Categories
  Loyalty          app/             Reward Points, Redemption
  Notifications    app/             Email alerts, In-app bell
  Reports          app/             Dashboard + all report pages
  HRM (optional)   Modules/HRM/     Employees, Attendance, Leave, Payroll


#### ARCHITECTURE DECISION RULE:

  Global (app/): every client needs it, or removing it breaks core features
  Module (Modules/): client can run the business without it — HRM only

TECH STACK:

  Component         Technology                  Version   Why
  ---------------   --------------------------  --------  -------------------------
  Framework         Laravel                     11.x      LTS, best PHP ecosystem
  Database          MariaDB                     10.11 LTS Faster, GENERATED COLS, free
  Cache / Sessions  Redis                       7.x       Queue + cache + sessions
  Auth              Laravel Sanctum             Latest    SPA cookie, same domain
  Permissions       Spatie Laravel Permission   Latest    Per-route role control
  Images            Spatie Media Library        Latest    Multi-image, conversions
  PDF               barryvdh/laravel-dompdf     Latest    Invoices, receipts, labels
  Excel             maatwebsite/excel           Latest    Import CSV, export reports
  API Docs          darkaonline/l5-swagger      Latest    Auto-generated Swagger
  Performance       Laravel Octane + Swoole     Latest    10x faster than FPM
  Frontend          Vue 3 + Pinia + Axios       Latest    Reactive SPA in Blade shells
  Form validation   VeeValidate 4               4.x       Client-side field errors
  Charts            Chart.js + vue-chartjs      4.x       Dashboard charts
  UI Shell          SmartAdmin                  4.5.1     Bootstrap 4.5 admin layout
  Build             Vite                        Latest    Fast HMR, asset pipeline
  Modules           nwidart/laravel-modules     Latest    HRM only

MARIADB 10.11 NOTES:
  - .env: DB_CONNECTION=mysql (Laravel uses same PDO driver for MariaDB)
  - UUIDs stored as CHAR(36)
  - GENERATED COLUMNS: ->storedAs('expr') in migrations
  - FULLTEXT: ->fullText(['col1','col2']) — use for POS search
  - All tables use InnoDB, charset utf8mb4, collation utf8mb4_unicode_ci
  - Strict mode in AppServiceProvider::boot():
      Schema::defaultStringLength(191);
      DB::statement("SET GLOBAL sql_mode='STRICT_TRANS_TABLES,
        NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,
        NO_ENGINE_SUBSTITUTION'");

SMARTADMIN v4.5.1 INTEGRATION:
  Copy smartadmin-html-full/dist/ → public/smartadmin/

  In layouts/app.blade.php:
    <link href="{{ asset('smartadmin/css/vendors.min.css') }}" rel="stylesheet">
    <link href="{{ asset('smartadmin/css/app.min.css') }}" rel="stylesheet">
    <link href="{{ asset('smartadmin/css/app.config.css') }}" rel="stylesheet">
    ...
    <script src="{{ asset('smartadmin/js/vendors.bundle.js') }}"></script>
    <script src="{{ asset('smartadmin/js/app.bundle.js') }}"></script>

  Key SmartAdmin CSS classes used in Vue components:
    Layout:  .page-wrapper, .page-inner, .page-content-wrapper, .subheader
    Cards:   .card, .card-header, .card-body, .card-footer
    Panels:  .panel, .panel-hdr, .panel-container, .panel-content
    Tables:  .table, .table-hover, .table-bordered, .dataTable-wrapper
    Buttons: .btn, .btn-primary, .btn-sm, .btn-icon, .btn-danger
    Forms:   .form-group, .form-control, .input-group, .form-check
    Badges:  .badge, .badge-pill, .badge-success, .badge-danger, .badge-warning
    Modals:  .modal, .modal-dialog, .modal-content, .modal-header, .modal-footer
    Alerts:  .alert, .alert-success, .alert-danger, .alert-warning, .alert-info
    Sidebar: .nav, .nav-title, .nav-item, .nav-link, .nav-icon

  Layout API settings (add to main JS):
    initApp.pushSettings("nav-function-fixed")    — fixed sidebar
    initApp.pushSettings("header-function-fixed") — fixed topbar

  Blade shell pattern (every page):
    @extends('layouts.app')
    @section('content')
      <div class="subheader"><h1 class="subheader-title">Page Title</h1></div>
      <div id="page-app"></div>
    @endsection
    @push('scripts') @vite('resources/js/pages/pagename/index.js') @endpush

  Vue mount pattern:
    import { createApp } from 'vue'
    import { createPinia } from 'pinia'
    import PageComponent from './PageComponent.vue'
    createApp(PageComponent).use(createPinia()).mount('#page-app')


## SECTION 2 — COMPLETE DATABASE SCHEMA (67 tables total)


  Global tables: 58
  HRM tables:     9
  Total:         67

  Group  #    Table                      Purpose
  -----  ---  -------------------------  ----------------------------------------
  A      001  businesses                 Tenant root
  A      002  branches                   Physical locations per business
  A      003  warehouses                 Stock storage locations
  A      004  users                      System users + roles
  A      005  (spatie tables)            roles, permissions, model_has_roles, etc.
  A      006  settings                   Business config (key-value, Redis-cached)
  A      007  audit_logs                 Append-only action log

  B      008  tax_rates                  Individual tax rates
  B      009  tax_groups                 Compound tax group headers
  B      010  tax_group_items            Pivot: tax_group ↔ tax_rate

  C      011  customer_groups            Pricing/discount groups
  C      012  customers                  Buyers (FULLTEXT indexed)
  C      013  suppliers                  Vendors

  D      014  product_categories         Hierarchical (2 levels max)
  D      015  brands                     Product brands
  D      016  units                      Units of measure
  D      017  sub_units                  Sub-units with conversion factor
  D      018  variation_templates        Reusable variation definitions
  D      019  variation_values           Values per template
  D      020  products                   Product master (FULLTEXT indexed)
  D      021  product_variations         Variant rows per variable product
  D      022  combo_items                Components of combo products
  D      023  price_groups               Wholesale / retail price tiers
  D      024  price_group_prices         Per-product price per group

  E      025  stock_movements            Append-only stock ledger
  E      026  stock_levels               Running balance per product/warehouse
  E      027  stock_lots                 Lot/batch records per product/warehouse
  E      028  stock_serials              Serial number records per product
  E      029  stock_counts               Physical count sessions
  E      030  stock_count_items          Items counted per session

  F      031  sales                      Sale header
  F      032  sale_items                 Line items per sale
  F      033  sale_item_lots             Lot selections per sale line
  F      034  sale_item_serials          Serial selections per sale line
  F      035  sale_payments              Payment lines per sale
  F      036  sale_returns               Return header
  F      037  sale_return_items          Items per return
  F      038  cash_registers             POS register definitions
  F      039  cash_register_sessions     Shift open/close per cashier

  G      040  purchases                  Purchase order header
  G      041  purchase_items             Line items per PO
  G      042  purchase_receives          Goods received events
  G      043  purchase_receive_items     Items per receive event
  G      044  purchase_receive_lots      Lot details received per item
  G      045  purchase_receive_serials   Serial numbers received per item
  G      046  purchase_returns           Return goods to supplier header
  G      047  purchase_return_items      Items per return

  H      048  payment_accounts           Named cash/bank accounts
  H      049  account_transactions       Append-only transaction log per account
  H      050  chart_of_accounts          Full COA tree
  H      051  fiscal_years               Accounting periods
  H      052  journals                   Journal header per financial event
  H      053  journal_entries            Debit/credit lines (append-only)

  I      054  purchase_payments          Payments sent to suppliers
  I      055  expense_categories         Expense groupings
  I      056  expenses                   Operating costs
  I      057  installment_plans          Payment plan definitions
  I      058  installment_schedules      Individual payment rows per plan

  J      059  loyalty_settings           Points earn/redeem config
  J      060  loyalty_transactions       Points history per customer (append-only)

  K      061  notifications              Laravel standard notifications

  HRM    H01  departments                Org chart
  HRM    H02  designations               Job titles
  HRM    H03  employees                  Staff records
  HRM    H04  attendance_records         Daily clock in/out
  HRM    H05  leave_types                Leave type definitions
  HRM    H06  leave_balances             Days available per employee (GENERATED COL)
  HRM    H07  leave_requests             Applications and approvals
  HRM    H08  payroll_runs               Monthly payroll header
  HRM    H09  payroll_items              Per-employee payroll detail


#### COLUMN CONVENTIONS (apply to every table)


  id                CHAR(36) PK           UUID, auto-generated via HasUuid trait
  business_id       CHAR(36) FK           On every table except businesses itself
  created_by        CHAR(36) FK → users   Nullable. Auto-set via HasUserTracking.
  updated_by        CHAR(36) FK → users   Nullable. Auto-set on update.
  created_at        TIMESTAMP             Auto-managed by Laravel
  updated_at        TIMESTAMP             Auto-managed. OMITTED on append-only tables.
  deleted_at        TIMESTAMP NULL        SoftDeletes. OMITTED on junction/log tables.

  Money columns:    DECIMAL(15,2)         Always 2 decimal places for currency
  Quantity columns: DECIMAL(15,4)         4dp for weight/liquid/partial units
  Rate/% columns:   DECIMAL(5,2)          e.g. 10.50 for 10.5%
  Boolean columns:  TINYINT(1)            0 = false, 1 = true (MariaDB standard)
  Enum columns:     ENUM('a','b','c')     Explicit list. Always has a default.


### Group A — FOUNDATION


**`businesses:`**
  id                CHAR(36) PK
  name              VARCHAR(255)     Trading name shown in the system
  legal_name        VARCHAR(255)     Printed on invoices and tax documents
  tax_id            VARCHAR(50)      VAT / GST / TIN registration number
  email             VARCHAR(255) UNIQUE
  phone             VARCHAR(20)
  currency          CHAR(3)          e.g. USD, KHR, THB, SGD. Default: USD
  timezone          VARCHAR(100)     e.g. Asia/Phnom_Penh, UTC. Default: UTC
  country           CHAR(2)          ISO 3166 country code e.g. KH, TH, SG
  address           JSON             { street, city, state, postcode, country }
  logo_url          VARCHAR(500)
  tier              ENUM             basic | standard | enterprise
  status            ENUM             active | suspended | cancelled
  max_users         INT              Tier-based user limit
  max_branches      INT              Tier-based branch limit
  financial_year    JSON             { start_month: 1 }
  settings_cache    JSON             Flat key-value cache of active settings
  created_at, updated_at
  deleted_at
  INDEX(status, created_at)

  Note: Business does NOT use BelongsToTenant. It IS the tenant root.


**`branches:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK → businesses  [INDEX]
  name              VARCHAR(255)
  code              VARCHAR(50)      Auto-generate: BR-001. Unique per business.
  type              ENUM             retail | warehouse | office | online
  address           JSON
  phone             VARCHAR(20)
  email             VARCHAR(100)
  manager_id        CHAR(36) FK → users (nullable)  [INDEX]
  is_active         TINYINT(1)       Default: 1
  is_default        TINYINT(1)       Default: 0. One default per business.
  business_hours    JSON             { mon: {open:"09:00",close:"18:00"}, ... }
  invoice_settings  JSON             Per-branch invoice layout overrides
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, code)


**`warehouses:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  branch_id         CHAR(36) FK → branches (nullable)  [INDEX]
  name              VARCHAR(255)
  code              VARCHAR(50)      Auto-generate: WH-001. Unique per business.
  type              ENUM             main | transit | returns | damaged
  is_active         TINYINT(1)       Default: 1
  is_default        TINYINT(1)       Default: 0. One default per business.
  allow_negative_stock  TINYINT(1)   Default: 0
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, code)


**`users:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  first_name        VARCHAR(100)
  last_name         VARCHAR(100)
  email             VARCHAR(255) UNIQUE
  password          VARCHAR(255)
  phone             VARCHAR(20)
  avatar_url        VARCHAR(500)
  status            ENUM             active | inactive | suspended
  max_discount      DECIMAL(5,2)     Max POS discount %. 0 = unlimited.
  last_login_at     TIMESTAMP NULL
  preferences       JSON             { theme, sidebar, language, default_warehouse_id }
  email_verified_at TIMESTAMP NULL
  remember_token    VARCHAR(100)
  created_at, updated_at
  deleted_at
  INDEX(business_id, status)
  INDEX(business_id, email)


**`settings:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  key               VARCHAR(100)
  value             TEXT
  type              VARCHAR(20)      string | integer | boolean | json
  group             VARCHAR(50)      general | invoice | tax | pos |
                                     stock | email | notifications | loyalty
  is_encrypted      TINYINT(1)       Default: 0
  created_at, updated_at
  UNIQUE(business_id, key)

  Stock-related settings (group = 'stock'):
    enable_lot_tracking         boolean   Default: false
    enable_serial_tracking      boolean   Default: false
    lot_expiry_alert_days       integer   Default: 30 (alert N days before expiry)
    default_lot_selection       string    fifo | fefo | manual
                                          fifo = First In First Out (by received_at)
                                          fefo = First Expired First Out (by expiry_date)
                                          manual = cashier selects lot on POS


**`audit_logs:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  user_id           CHAR(36) FK → users (nullable)  [INDEX]
  event             VARCHAR(50)      created|updated|deleted|login|logout|state_change
  auditable_type    VARCHAR(100)     PHP model class name
  auditable_id      CHAR(36)         UUID of the affected record
  old_values        JSON
  new_values        JSON
  ip_address        VARCHAR(45)
  user_agent        VARCHAR(500)
  created_at        TIMESTAMP        NO updated_at — append-only
  INDEX(business_id, created_at)
  INDEX(auditable_type, auditable_id)
  INDEX(business_id, user_id)

  MariaDB tip: Partition by YEAR(created_at) when rows exceed 1 million.


### Group B — TAX CONFIGURATION


**`tax_rates:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)     e.g. VAT, GST, Sales Tax
  rate              DECIMAL(5,2)     e.g. 10.00 for 10%
  type              ENUM             percentage | fixed
  is_default        TINYINT(1)       Default: 0. Only one default per business.
  is_active         TINYINT(1)       Default: 1
  created_at, updated_at
  deleted_at


**`tax_groups:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)     e.g. CGST+SGST
  description       TEXT
  is_active         TINYINT(1)
  created_at, updated_at
  deleted_at


**`tax_group_items:`**
  id                CHAR(36) PK
  tax_group_id      CHAR(36) FK → tax_groups  [INDEX]
  tax_rate_id       CHAR(36) FK → tax_rates   [INDEX]
  UNIQUE(tax_group_id, tax_rate_id)


### Group C — CONTACTS


**`customer_groups:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)
  discount          DECIMAL(5,2)     Default discount % for group members
  price_group_id    CHAR(36) FK → price_groups (nullable)
  created_at, updated_at
  deleted_at


**`customers:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  customer_group_id CHAR(36) FK → customer_groups (nullable)  [INDEX]
  code              VARCHAR(50)      Auto-generate: CUST-00001
  name              VARCHAR(255)
  type              ENUM             individual | company
  email             VARCHAR(255)
  phone             VARCHAR(20)
  mobile            VARCHAR(20)
  tax_id            VARCHAR(50)
  date_of_birth     DATE
  address           JSON
  credit_limit      DECIMAL(15,2)    0 = unlimited
  pay_term          SMALLINT         Days until invoice due. e.g. 30
  opening_balance   DECIMAL(15,2)    Default: 0
  status            ENUM             active | inactive
  notes             TEXT
  created_by        CHAR(36) FK → users  [INDEX]
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, code)
  INDEX(business_id, status)
  INDEX(business_id, phone)
  FULLTEXT(name, email, phone, mobile)   — POS typeahead search

  Note: balance and reward_points are COMPUTED, never stored.


**`suppliers:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  code              VARCHAR(50)      Auto-generate: SUPP-00001
  name              VARCHAR(255)
  company           VARCHAR(255)
  email             VARCHAR(255)
  phone             VARCHAR(20)
  mobile            VARCHAR(20)
  tax_id            VARCHAR(50)
  address           JSON
  pay_term          SMALLINT
  opening_balance   DECIMAL(15,2)    Default: 0
  status            ENUM             active | inactive
  notes             TEXT
  created_by        CHAR(36) FK → users  [INDEX]
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, code)
  INDEX(business_id, status)


### Group D — CATALOG


**`product_categories:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  parent_id         CHAR(36) FK → product_categories (nullable)  [INDEX]
  name              VARCHAR(255)
  code              VARCHAR(50)
  short_code        VARCHAR(10)      POS category filter shortcut
  image_url         VARCHAR(500)
  sort_order        SMALLINT         Default: 0
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, name)
  INDEX(business_id, parent_id)


**`brands:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(255)
  description       TEXT
  image_url         VARCHAR(500)
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, name)


**`units:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)     e.g. Piece
  short_name        VARCHAR(10)      e.g. pcs
  allow_decimal     TINYINT(1)       Default: 0. 1 = allow 1.5 pcs
  created_at, updated_at
  deleted_at


**`sub_units:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  parent_unit_id    CHAR(36) FK → units  [INDEX]
  name              VARCHAR(100)
  short_name        VARCHAR(10)
  conversion_factor DECIMAL(10,4)    e.g. 12.0000 → 1 box = 12 pcs
  created_at, updated_at
  deleted_at


**`variation_templates:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)     e.g. Size, Color, Flavor
  created_at, updated_at
  deleted_at


**`variation_values:`**
  id                CHAR(36) PK
  variation_template_id  CHAR(36) FK → variation_templates  [INDEX]
  name              VARCHAR(100)     e.g. Small, Medium, Large
  sort_order        SMALLINT         Default: 0
  created_at, updated_at
  deleted_at


**`products:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  category_id       CHAR(36) FK → product_categories (nullable)  [INDEX]
  brand_id          CHAR(36) FK → brands (nullable)  [INDEX]
  unit_id           CHAR(36) FK → units  [INDEX]
  sub_unit_id       CHAR(36) FK → sub_units (nullable)
  tax_rate_id       CHAR(36) FK → tax_rates (nullable)
  name              VARCHAR(255)
  description       TEXT
  sku               VARCHAR(100)     Unique per business. Auto-generate with prefix.
  barcode           VARCHAR(100)     Unique per business if provided.
  barcode_type      ENUM             C128 | EAN13 | QR. Default: C128
  type              ENUM             single | variable | service | combo
  image_url         VARCHAR(500)
  selling_price     DECIMAL(15,4)
  purchase_price    DECIMAL(15,4)
  profit_margin     DECIMAL(5,2)     Auto-calc: selling = purchase * (1 + margin/100)
  tax_type          ENUM             inclusive | exclusive. Default: exclusive
  track_inventory   TINYINT(1)       Default: 1. Set 0 for services.
  stock_tracking    ENUM             none | lot | serial

#### STOCK TRACKING MODE:

    none   = Track by quantity only (default for most products)
    lot    = Track by lot/batch number. Multiple units share one lot.
             Used for: pharmaceuticals, food, chemicals, cosmetics.
    serial = Track each physical unit individually by serial number.
             Used for: electronics, machinery, tools, warranty items.

  has_expiry        TINYINT(1)       Default: 0. Auto-set 1 when stock_tracking=lot
  alert_quantity    DECIMAL(15,4)    Notification threshold for qty-mode products
  max_stock_level   DECIMAL(15,4)    Reorder suggestion
  is_for_selling    TINYINT(1)       Default: 1. Set 0 to hide from POS.
  is_active         TINYINT(1)       Default: 1
  weight            DECIMAL(8,3)
  created_by        CHAR(36) FK → users  [INDEX]
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, sku)
  INDEX(business_id, category_id, is_active)
  INDEX(business_id, stock_tracking)
  FULLTEXT(name, sku, barcode)


**`product_variations:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  name              VARCHAR(255)     e.g. "Red / Large"
  variation_value_ids  JSON          Array of variation_value IDs
  sku               VARCHAR(100)
  barcode           VARCHAR(100)
  selling_price     DECIMAL(15,4)
  purchase_price    DECIMAL(15,4)
  profit_margin     DECIMAL(5,2)
  is_active         TINYINT(1)
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, sku)


**`combo_items:`**
  id                CHAR(36) PK
  product_id        CHAR(36) FK → products  [INDEX]   (the combo parent)
  child_product_id  CHAR(36) FK → products  [INDEX]   (a component)
  child_variation_id  CHAR(36) FK → product_variations (nullable)
  quantity          DECIMAL(15,4)
  created_at, updated_at


**`price_groups:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)
  description       TEXT
  is_default        TINYINT(1)       Default: 0
  created_at, updated_at
  deleted_at


**`price_group_prices:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  price_group_id    CHAR(36) FK → price_groups  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK → product_variations (nullable)
  price             DECIMAL(15,4)
  UNIQUE(price_group_id, product_id, variation_id)


### Group E — INVENTORY (including Lot and Serial tracking)


#### CRITICAL RULE: Stock is NEVER modified directly.

All changes go through StockMovementService, which writes the ledger row
first, then updates stock_levels. Lot and serial states are also updated
only by this service — never by controllers or other services directly.

  ┌────────────────────────────────────────────────────────────────────────┐
  │  STOCK TRACKING MODES EXPLAINED                                        │
  │                                                                        │
  │  MODE: none (default)                                                  │
  │    Stock is tracked purely by quantity.                                │
  │    stock_movements records how qty changes.                            │
  │    stock_levels holds current qty + reserved_qty per warehouse.        │
  │    No lots or serials involved.                                        │
  │                                                                        │
  │  MODE: lot                                                             │
  │    A "lot" (also called batch) is a group of units that were           │
  │    produced or received together with the same lot number.             │
  │    They share: lot_number, expiry_date, manufacture_date,              │
  │                supplier, received_date, unit_cost.                     │
  │    stock_lots holds one row per lot per product per warehouse.         │
  │    qty_on_hand on the lot is updated as units are sold/transferred.    │
  │    stock_movements.lot_id links each movement to its lot.              │
  │    Examples: medicines (Lot# L2024-0012), food, paint, chemicals       │
  │                                                                        │
  │  MODE: serial                                                          │
  │    Every single physical unit has its own unique serial number.        │
  │    stock_serials holds one row per physical unit.                      │
  │    Each serial has a status that changes as it moves through life.     │
  │    stock_movements.serial_id links each movement to its serial.        │
  │    Examples: laptops, phones, refrigerators, tools, machinery          │
  │                                                                        │
  │  NOTE: lot and serial modes cannot be mixed on the same product.       │
  │  A product has exactly ONE stock_tracking value: none | lot | serial.  │
  └────────────────────────────────────────────────────────────────────────┘


**`stock_movements:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK → product_variations (nullable)
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  lot_id            CHAR(36) FK → stock_lots (nullable)     — set when mode = lot
  serial_id         CHAR(36) FK → stock_serials (nullable)  — set when mode = serial
  type              ENUM:
                      opening_stock       | purchase_receipt   | sale
                      sale_return         | purchase_return    | adjustment_in
                      adjustment_out      | transfer_in        | transfer_out
                      combo_deduction     | stock_count_correction
  quantity          DECIMAL(15,4)    Always positive. Direction encoded in type.
  unit_cost         DECIMAL(15,4)    Cost at time of movement (for COGS)
  reference_type    VARCHAR(100)     Polymorphic: Sale, Purchase, StockCount, etc.
  reference_id      CHAR(36)         UUID of the source document
  notes             TEXT
  created_by        CHAR(36) FK → users  [INDEX]
  created_at        TIMESTAMP        NO updated_at — append-only
  INDEX(business_id, created_at)
  INDEX(product_id, warehouse_id, created_at)
  INDEX(reference_type, reference_id)
  INDEX(lot_id)
  INDEX(serial_id)

  For lot-tracked products:   quantity > 0, lot_id is required
  For serial-tracked products: quantity = 1 always, serial_id is required
  For qty-only products:      lot_id and serial_id are both NULL


**`stock_levels:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK → product_variations (nullable)
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  quantity          DECIMAL(15,4)    Total on-hand (sum of all lots, or count of in_stock serials)
  reserved_quantity DECIMAL(15,4)    Reserved for confirmed/suspended sales
  available_qty     DECIMAL(15,4)    GENERATED ALWAYS AS (quantity - reserved_quantity) STORED
  updated_at        TIMESTAMP
  UNIQUE(product_id, variation_id, warehouse_id)

  For lot-tracked products: quantity = SUM(stock_lots.qty_on_hand) for this product+warehouse
  For serial-tracked products: quantity = COUNT(stock_serials WHERE status='in_stock')


**`stock_lots:`**
  One row per lot per product per warehouse.
  A lot is a group of units received together with the same lot_number.
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK → product_variations (nullable)
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  supplier_id       CHAR(36) FK → suppliers (nullable)  [INDEX]
  lot_number        VARCHAR(100)     The lot/batch number as printed on packaging
  manufacture_date  DATE             Date of manufacture (optional)
  expiry_date       DATE             Expiry / use-by date (required if has_expiry=1)
  received_at       TIMESTAMP        When this lot was first received into warehouse
  unit_cost         DECIMAL(15,4)    Purchase cost per unit of this lot
  qty_received      DECIMAL(15,4)    Total quantity originally received in this lot
  qty_on_hand       DECIMAL(15,4)    Current remaining quantity (decreases on sale)
  qty_reserved      DECIMAL(15,4)    Reserved for confirmed orders (default: 0)
  qty_available     DECIMAL(15,4)    GENERATED AS (qty_on_hand - qty_reserved) STORED
  status            ENUM             active | depleted | expired | recalled | quarantine
  notes             TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at
  INDEX(business_id, expiry_date)                   — for expiry alert daily job
  INDEX(product_id, warehouse_id, status)           — for lot selection on POS
  INDEX(product_id, warehouse_id, received_at)      — for FIFO selection
  INDEX(product_id, warehouse_id, expiry_date)      — for FEFO selection
  INDEX(business_id, lot_number)                    — search lots by number

  Lot status transitions:
    active     → depleted (qty_on_hand reaches 0 automatically)
    active     → expired (daily job when expiry_date < today)
    active     → recalled (manual — admin action)
    active     → quarantine (manual — quality hold)
    quarantine → active (released from hold)
    quarantine → recalled


**`stock_serials:`**
  One row per physical unit.
  quantity in stock_movements is always 1 for serial-tracked products.
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK → product_variations (nullable)
  warehouse_id      CHAR(36) FK → warehouses (nullable — null if sold)  [INDEX]
  supplier_id       CHAR(36) FK → suppliers (nullable)
  serial_number     VARCHAR(200)     The serial number printed on the physical unit
  status            ENUM             in_stock | sold | returned | transferred |
                                     written_off | reserved
  purchase_item_id  CHAR(36) FK → purchase_items (nullable)  — where it was received
  sale_item_id      CHAR(36) FK → sale_items (nullable)       — where it was sold
  unit_cost         DECIMAL(15,4)    Cost when received
  warranty_expires  DATE             Optional warranty expiry date
  notes             TEXT
  received_at       TIMESTAMP        When this serial was received into inventory
  sold_at           TIMESTAMP NULL   When it was sold
  created_by        CHAR(36) FK → users
  created_at, updated_at
  UNIQUE(business_id, serial_number)               — serial must be unique per business
  INDEX(product_id, warehouse_id, status)          — POS lookup
  INDEX(business_id, status)
  INDEX(business_id, serial_number)                — search by serial number

  Serial status transitions:
    in_stock    → reserved   (sale confirmed — serial is held)
    reserved    → sold       (sale completed)
    reserved    → in_stock   (sale cancelled — reservation released)
    sold        → returned   (sale return processed)
    returned    → in_stock   (returned unit put back into stock)
    in_stock    → transferred (stock transfer out — updates warehouse_id)
    in_stock    → written_off (damage, loss, disposal)


**`stock_counts:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  reference_no      VARCHAR(50)     Auto-generate: SC-2024-00001
  status            ENUM            in_progress | completed | cancelled
  date              DATE
  notes             TEXT
  created_by        CHAR(36) FK → users
  completed_by      CHAR(36) FK → users (nullable)
  created_at, updated_at
  deleted_at


**`stock_count_items:`**
  id                CHAR(36) PK
  stock_count_id    CHAR(36) FK → stock_counts  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK (nullable)
  lot_id            CHAR(36) FK → stock_lots (nullable)    — for lot-tracked products
  system_quantity   DECIMAL(15,4)    What stock_levels (or lot qty) showed at start
  counted_quantity  DECIMAL(15,4)    What was physically counted
  difference        DECIMAL(15,4)    GENERATED AS (counted_quantity - system_quantity) STORED
  unit_cost         DECIMAL(15,4)

  For serial-tracked products: stock count instead uses a stock_count_serials
  table where each serial is individually verified (found / missing).

  stock_count_serials:  (only for serial-tracked products in a count)
    id                CHAR(36) PK
    stock_count_id    CHAR(36) FK  [INDEX]
    serial_id         CHAR(36) FK → stock_serials  [INDEX]
    found             TINYINT(1)   1 = physically found, 0 = missing


### Group F — SALES (with Lot and Serial selection)


**`sales:`**
  id                      CHAR(36) PK
  business_id             CHAR(36) FK  [INDEX]
  branch_id               CHAR(36) FK → branches  [INDEX]
  warehouse_id            CHAR(36) FK → warehouses  [INDEX]
  customer_id             CHAR(36) FK → customers (nullable)  [INDEX]
  cash_register_session_id  CHAR(36) FK → cash_register_sessions (nullable)
  created_by              CHAR(36) FK → users  [INDEX]
  sale_number             VARCHAR(50)      Auto-generate: INV-2024-00001
  type                    ENUM             pos_sale | invoice | draft | quotation | suspended
  status                  ENUM             draft | quotation | suspended |
                                           confirmed | completed | cancelled | returned
  payment_status          ENUM             unpaid | partial | paid
  sale_date               DATE
  due_date                DATE
  subtotal                DECIMAL(15,2)
  discount_type           ENUM             fixed | percentage (nullable)
  discount_amount         DECIMAL(15,2)    Default: 0
  tax_amount              DECIMAL(15,2)
  shipping_charges        DECIMAL(15,2)    Default: 0
  total_amount            DECIMAL(15,2)
  paid_amount             DECIMAL(15,2)
  change_amount           DECIMAL(15,2)
  price_group_id          CHAR(36) FK → price_groups (nullable)
  notes                   TEXT
  staff_note              TEXT
  is_recurring            TINYINT(1)       Default: 0
  recurring_interval      ENUM             daily | weekly | monthly (nullable)
  created_at, updated_at
  deleted_at
  INDEX(business_id, status, created_at)
  INDEX(business_id, payment_status, due_date)
  INDEX(business_id, customer_id, created_at)
  INDEX(business_id, sale_number)


**`sale_items:`**
  id                CHAR(36) PK
  sale_id           CHAR(36) FK → sales  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK (nullable)
  sub_unit_id       CHAR(36) FK (nullable)
  quantity          DECIMAL(15,4)
  unit_price        DECIMAL(15,4)    Snapshot at time of sale
  discount_type     ENUM             fixed | percentage (nullable)
  discount_amount   DECIMAL(15,2)    Default: 0
  tax_rate          DECIMAL(5,2)     Snapshot
  tax_type          ENUM             inclusive | exclusive
  tax_amount        DECIMAL(15,2)
  unit_cost         DECIMAL(15,4)    Snapshot for COGS
  total_amount      DECIMAL(15,2)
  notes             TEXT
  created_at, updated_at


**`sale_item_lots:`**
  Created when sale_items.product.stock_tracking = 'lot'.
  One row per lot used for this line item.
  One line item can pull from multiple lots (e.g. need 10 units, lot A has
  6 remaining, lot B provides the other 4 → two rows here).
  id                CHAR(36) PK
  sale_item_id      CHAR(36) FK → sale_items  [INDEX]
  lot_id            CHAR(36) FK → stock_lots  [INDEX]
  quantity          DECIMAL(15,4)    How many units from this lot are in this sale
  unit_cost         DECIMAL(15,4)    Snapshot from lot.unit_cost at time of sale
  created_at, updated_at


**`sale_item_serials:`**
  Created when sale_items.product.stock_tracking = 'serial'.
  One row per serial number sold.
  quantity on sale_item must equal COUNT(*) of these rows.
  id                CHAR(36) PK
  sale_item_id      CHAR(36) FK → sale_items  [INDEX]
  serial_id         CHAR(36) FK → stock_serials  [INDEX]
  created_at        TIMESTAMP
  UNIQUE(sale_item_id, serial_id)


**`sale_payments:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  sale_id           CHAR(36) FK → sales  [INDEX]
  payment_account_id  CHAR(36) FK → payment_accounts  [INDEX]
  amount            DECIMAL(15,2)
  method            ENUM             cash | card | bank_transfer | cheque |
                                     reward_points | other
  reference         VARCHAR(255)
  payment_date      DATE
  note              TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at


**`sale_returns:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  sale_id           CHAR(36) FK → sales  [INDEX]
  branch_id         CHAR(36) FK → branches
  warehouse_id      CHAR(36) FK → warehouses
  return_number     VARCHAR(50)      Auto-generate: RET-2024-00001
  status            ENUM             draft | completed
  return_date       DATE
  total_amount      DECIMAL(15,2)
  refund_method     ENUM             cash | credit_note | bank_transfer | reward_points
  notes             TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at
  deleted_at


**`sale_return_items:`**
  id                CHAR(36) PK
  sale_return_id    CHAR(36) FK → sale_returns  [INDEX]
  sale_item_id      CHAR(36) FK → sale_items  [INDEX]
  product_id        CHAR(36) FK → products
  variation_id      CHAR(36) FK (nullable)
  quantity          DECIMAL(15,4)
  unit_price        DECIMAL(15,4)
  unit_cost         DECIMAL(15,4)
  total_amount      DECIMAL(15,2)
  lot_id            CHAR(36) FK → stock_lots (nullable)    — returned to this lot
  serial_ids        JSON             Array of serial UUIDs being returned


**`cash_registers:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  branch_id         CHAR(36) FK → branches  [INDEX]
  name              VARCHAR(100)
  is_active         TINYINT(1)       Default: 1
  created_at, updated_at
  deleted_at


**`cash_register_sessions:`**
  id                CHAR(36) PK
  cash_register_id  CHAR(36) FK → cash_registers  [INDEX]
  user_id           CHAR(36) FK → users  [INDEX]
  opening_float     DECIMAL(15,2)
  closing_float     DECIMAL(15,2)    Null while session is open
  total_sales       DECIMAL(15,2)    Computed from sale_payments (method=cash)
  status            ENUM             open | closed
  opened_at         TIMESTAMP
  closed_at         TIMESTAMP NULL
  notes             TEXT
  created_at, updated_at


### Group G — PURCHASES (with Lot and Serial receiving)


**`purchases:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  supplier_id       CHAR(36) FK → suppliers  [INDEX]
  branch_id         CHAR(36) FK → branches  [INDEX]
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  created_by        CHAR(36) FK → users
  purchase_number   VARCHAR(50)      Auto-generate: PO-2024-00001
  status            ENUM             draft | ordered | partial_received |
                                     received | cancelled
  payment_status    ENUM             unpaid | partial | paid
  order_date        DATE
  expected_date     DATE
  received_date     DATE
  subtotal          DECIMAL(15,2)
  discount_type     ENUM             fixed | percentage (nullable)
  discount_amount   DECIMAL(15,2)
  tax_amount        DECIMAL(15,2)
  shipping_charges  DECIMAL(15,2)
  total_amount      DECIMAL(15,2)
  paid_amount       DECIMAL(15,2)
  additional_notes  TEXT
  notes_for_supplier  TEXT
  created_at, updated_at
  deleted_at
  INDEX(business_id, status, created_at)
  INDEX(business_id, supplier_id)


**`purchase_items:`**
  id                CHAR(36) PK
  purchase_id       CHAR(36) FK → purchases  [INDEX]
  product_id        CHAR(36) FK → products  [INDEX]
  variation_id      CHAR(36) FK (nullable)
  quantity          DECIMAL(15,4)
  quantity_received DECIMAL(15,4)    Updated as receives happen. Default: 0.
  unit_price        DECIMAL(15,4)
  discount_amount   DECIMAL(15,2)
  tax_rate          DECIMAL(5,2)
  tax_amount        DECIMAL(15,2)
  total_amount      DECIMAL(15,2)
  created_at, updated_at


**`purchase_receives:`**
  id                CHAR(36) PK
  purchase_id       CHAR(36) FK → purchases  [INDEX]
  warehouse_id      CHAR(36) FK → warehouses  [INDEX]
  reference_no      VARCHAR(50)      e.g. GRN-2024-00001
  received_date     DATE
  notes             TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at


**`purchase_receive_items:`**
  id                CHAR(36) PK
  purchase_receive_id  CHAR(36) FK → purchase_receives  [INDEX]
  purchase_item_id  CHAR(36) FK → purchase_items  [INDEX]
  product_id        CHAR(36) FK → products
  variation_id      CHAR(36) FK (nullable)
  quantity_received DECIMAL(15,4)
  unit_cost         DECIMAL(15,4)    Actual cost on receipt (may differ from PO price)
  created_at, updated_at


**`purchase_receive_lots:`**
  Created when receiving a lot-tracked product.
  One row per lot received in this receive event.
  Multiple different lots can be received against one purchase_receive_item.
  id                CHAR(36) PK
  purchase_receive_item_id  CHAR(36) FK → purchase_receive_items  [INDEX]
  lot_number        VARCHAR(100)     Lot number from supplier label
  manufacture_date  DATE             (optional)
  expiry_date       DATE             Required if product.has_expiry = 1
  quantity          DECIMAL(15,4)    Units in this lot received in this event
  unit_cost         DECIMAL(15,4)
  notes             TEXT
  created_at, updated_at

  On save: StockMovementService creates/updates the stock_lots row for this
           lot_number + product + warehouse combination.
           If lot already exists (partial delivery): qty_received and qty_on_hand increase.
           If new lot: new stock_lots row is created.


**`purchase_receive_serials:`**
  Created when receiving a serial-tracked product.
  One row per serial number received.
  id                CHAR(36) PK
  purchase_receive_item_id  CHAR(36) FK → purchase_receive_items  [INDEX]
  serial_number     VARCHAR(200)     Serial number from packaging
  warranty_expires  DATE             (optional)
  unit_cost         DECIMAL(15,4)
  notes             TEXT
  created_at, updated_at

  On save: StockMovementService creates a new stock_serials row with
           status = in_stock for each serial number.
           Duplicate serial_number within same business throws exception.


**`purchase_returns:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  purchase_id       CHAR(36) FK → purchases  [INDEX]
  return_number     VARCHAR(50)
  status            ENUM             completed
  return_date       DATE
  total_amount      DECIMAL(15,2)
  notes             TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at
  deleted_at


**`purchase_return_items:`**
  id                CHAR(36) PK
  purchase_return_id  CHAR(36) FK  [INDEX]
  purchase_item_id  CHAR(36) FK  [INDEX]
  product_id        CHAR(36) FK → products
  variation_id      CHAR(36) FK (nullable)
  lot_id            CHAR(36) FK → stock_lots (nullable)    — which lot is being returned
  serial_ids        JSON             Array of serial UUIDs being returned
  quantity          DECIMAL(15,4)
  unit_price        DECIMAL(15,4)
  total_amount      DECIMAL(15,2)


### Group H — ACCOUNTING


**`payment_accounts:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)
  account_type      ENUM             cash | bank | other
  account_number    VARCHAR(50)
  bank_name         VARCHAR(100)
  opening_balance   DECIMAL(15,2)    Default: 0
  coa_account_id    CHAR(36) FK → chart_of_accounts (nullable)
  is_active         TINYINT(1)       Default: 1
  note              TEXT
  created_at, updated_at
  deleted_at


**`account_transactions:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  payment_account_id  CHAR(36) FK  [INDEX]
  type              ENUM             credit | debit
  amount            DECIMAL(15,2)
  reference_type    VARCHAR(100)
  reference_id      CHAR(36)
  transaction_date  DATE
  note              TEXT
  created_at        TIMESTAMP        Append-only
  INDEX(business_id, payment_account_id, transaction_date)


**`chart_of_accounts:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  parent_id         CHAR(36) FK → chart_of_accounts (nullable)  [INDEX]
  code              VARCHAR(20)      Unique per business
  name              VARCHAR(255)
  type              ENUM             asset | liability | equity | revenue | expense
  sub_type          VARCHAR(50)      current_asset | fixed_asset | bank | cash |
                                     current_liability | long_term_liability |
                                     equity | revenue | cogs | operating_expense
  normal_balance    ENUM             debit | credit
  is_system         TINYINT(1)       System accounts cannot be deleted
  is_active         TINYINT(1)       Default: 1
  description       TEXT
  created_at, updated_at
  deleted_at
  UNIQUE(business_id, code)


**`fiscal_years:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)     e.g. FY 2024
  start_date        DATE
  end_date          DATE
  status            ENUM             active | closed
  closed_at         TIMESTAMP NULL
  created_at, updated_at


**`journals:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  fiscal_year_id    CHAR(36) FK → fiscal_years (nullable)
  journal_number    VARCHAR(50)
  type              ENUM             sale | purchase | payment_in | payment_out |
                                     sale_return | purchase_return |
                                     expense | manual | reversal | opening
  reference_type    VARCHAR(100)
  reference_id      CHAR(36)
  description       VARCHAR(500)     Required
  total_amount      DECIMAL(15,2)    Must equal sum of debit entries
  posted_at         TIMESTAMP
  posted_by         CHAR(36) FK → users
  reversed_by_id    CHAR(36) FK → journals (nullable)
  created_at        TIMESTAMP
  INDEX(business_id, type, posted_at)
  INDEX(reference_type, reference_id)


**`journal_entries:`**
  id                CHAR(36) PK
  journal_id        CHAR(36) FK → journals  [INDEX]
  account_id        CHAR(36) FK → chart_of_accounts  [INDEX]
  type              ENUM             debit | credit
  amount            DECIMAL(15,2)    Always positive
  description       VARCHAR(255)
  created_at        TIMESTAMP        NO updated_at — append-only
  INDEX(account_id, created_at)

  Invariant: SUM(debit) MUST EQUAL SUM(credit).
  Violations throw UnbalancedJournalException before any DB write.


### Group I — PAYMENTS & EXPENSES


**`purchase_payments:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  purchase_id       CHAR(36) FK → purchases  [INDEX]
  payment_account_id  CHAR(36) FK  [INDEX]
  amount            DECIMAL(15,2)
  method            ENUM             cash | card | bank_transfer | cheque | other
  reference         VARCHAR(255)
  payment_date      DATE
  note              TEXT
  status            ENUM             completed | reversed
  created_by        CHAR(36) FK → users
  created_at, updated_at


**`expense_categories:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  name              VARCHAR(100)
  description       TEXT
  created_at, updated_at
  deleted_at


**`expenses:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  branch_id         CHAR(36) FK → branches (nullable)  [INDEX]
  expense_category_id  CHAR(36) FK  [INDEX]
  payment_account_id   CHAR(36) FK  [INDEX]
  coa_account_id    CHAR(36) FK → chart_of_accounts  [INDEX]
  expense_number    VARCHAR(50)
  expense_date      DATE
  amount            DECIMAL(15,2)
  tax_amount        DECIMAL(15,2)    Default: 0
  total_amount      DECIMAL(15,2)
  reference         VARCHAR(255)
  notes             TEXT
  attachment_url    VARCHAR(500)
  is_recurring      TINYINT(1)       Default: 0
  recurring_interval  ENUM           daily | weekly | monthly (nullable)
  created_by        CHAR(36) FK → users
  created_at, updated_at
  deleted_at


**`installment_plans:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  payable_type      VARCHAR(100)
  payable_id        CHAR(36)     [INDEX]
  total_amount      DECIMAL(15,2)
  installments_count  TINYINT
  frequency         ENUM             weekly | biweekly | monthly | custom
  start_date        DATE
  notes             TEXT
  created_by        CHAR(36) FK → users
  created_at, updated_at


**`installment_schedules:`**
  id                CHAR(36) PK
  plan_id           CHAR(36) FK → installment_plans  [INDEX]
  installment_number  TINYINT
  due_date          DATE
  amount            DECIMAL(15,2)
  paid_amount       DECIMAL(15,2)    Default: 0
  status            ENUM             pending | paid | overdue | partial
  payment_id        CHAR(36) (nullable)
  paid_at           TIMESTAMP NULL
  created_at, updated_at
  INDEX(plan_id, due_date)
  INDEX(status, due_date)


### Group J — LOYALTY


**`loyalty_settings:`**
  id                CHAR(36) PK
  business_id       CHAR(36) UNIQUE FK
  points_per_unit   DECIMAL(10,4)
  redeem_rate       DECIMAL(10,4)
  min_redeem_points INT
  expiry_months     TINYINT          0 = never expire
  is_active         TINYINT(1)       Default: 0
  created_at, updated_at


**`loyalty_transactions:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  customer_id       CHAR(36) FK → customers  [INDEX]
  type              ENUM             earned | redeemed | expired | adjusted
  points            INT
  reference_type    VARCHAR(100)
  reference_id      CHAR(36)
  note              TEXT
  expires_at        DATE
  created_at        TIMESTAMP        Append-only
  INDEX(customer_id, created_at)
  INDEX(status, expires_at)


### Group K — NOTIFICATIONS


  Standard Laravel notifications table.
  Schema: id, type, notifiable_type, notifiable_id, data(JSON),
          read_at, created_at, updated_at


### Group L — HRM MODULE (Modules/HRM/Database/Migrations/)


**`departments:`**
  id, business_id, parent_id (self-FK), name, description, manager_id, timestamps


**`designations:`**
  id, business_id, name, timestamps


**`employees:`**
  id                CHAR(36) PK
  business_id       CHAR(36) FK  [INDEX]
  user_id           CHAR(36) FK → users (nullable)
  branch_id         CHAR(36) FK → branches
  department_id     CHAR(36) FK → departments
  designation_id    CHAR(36) FK (nullable)
  employee_code     VARCHAR(50)      Unique per business: EMP-00001
  first_name, last_name
  gender            ENUM             male | female | other
  date_of_birth     DATE
  hire_date         DATE
  job_title         VARCHAR(100)
  phone, email
  address           JSON
  status            ENUM             active | on_leave | resigned | terminated
  salary_type       ENUM             monthly | hourly | daily
  salary_amount     DECIMAL(15,2)
  bank_account      JSON
  emergency_contact JSON
  created_at, updated_at, deleted_at
  UNIQUE(business_id, employee_code)


**`attendance_records:`**
  id, business_id, employee_id, date (DATE)
  check_in (TIME), check_out (TIME NULL), break_minutes (SMALLINT)
  working_hours (DECIMAL(5,2)), status (ENUM: present|absent|late|half_day|holiday|on_leave)
  is_overtime, overtime_hours, note, timestamps
  UNIQUE(employee_id, date)


**`leave_types:`**
  id, business_id, name, max_days_per_year (SMALLINT), is_paid (TINYINT), timestamps


**`leave_balances:`**
  id, business_id, employee_id, leave_type_id, year (SMALLINT)
  total_days (DECIMAL(5,1)), used_days (DECIMAL(5,1))
  remaining_days DECIMAL(5,1) GENERATED AS (total_days - used_days) STORED
  UNIQUE(employee_id, leave_type_id, year)


**`leave_requests:`**
  id, business_id, employee_id, leave_type_id
  start_date, end_date, total_days (DECIMAL(5,1)), reason
  status (ENUM: pending|approved|rejected|cancelled)
  approved_by (nullable FK), approved_at, rejection_reason, timestamps


**`payroll_runs:`**
  id, business_id, month (TINYINT), year (SMALLINT)
  status (ENUM: draft|processing|finalized)
  total_employees, total_gross, total_deductions, total_net
  finalized_at, finalized_by, notes, timestamps
  UNIQUE(business_id, month, year)


**`payroll_items:`**
  id, payroll_run_id, employee_id
  base_salary, allowances, deductions, overtime_pay, leave_deductions
  gross_pay, net_pay, working_days, absent_days, leave_days, overtime_hours
  allowances_detail (JSON), deductions_detail (JSON), timestamps


## SECTION 3 — BUSINESS REQUIREMENTS (All 19 Features)


### Feature 1 — AUTHENTICATION & SECURITY


What it does:
  Secure login via Laravel Sanctum SPA cookies. No tokens in localStorage.

Business rules:
  - Login: email + password
  - User must be active AND their business must be active to log in
  - Rate limit: 5 failed attempts per minute per IP → 429 Too Many Requests
  - On every login: record last_login_at, write audit_log row (event=login)
  - /auth/me: returns user + business + all roles + all permissions in one call
  - Password change requires current password confirmation first
  - Forgot password: sends a signed, time-limited reset link via email queue
  - Logout: destroys the current Sanctum session token only

Technical:
  - TenantResolver middleware sets app('tenant') = Business on every request
  - BelongsToTenant adds global Eloquent scope: WHERE business_id = app('tenant')->id
  - This makes it impossible for Business A to see Business B's data

API:
  POST  /api/v1/auth/login              Public      { email, password }
  POST  /api/v1/auth/logout             Auth
  GET   /api/v1/auth/me                 Auth
  PUT   /api/v1/auth/password           Auth        { current_password, new_password }
  POST  /api/v1/auth/forgot-password    Public      { email }
  POST  /api/v1/auth/reset-password     Public      { token, email, password }


### Feature 2 — USERS & ROLES


What it does:
  Manage who can access the system and what they are allowed to do.

Roles (seeded at setup):
  SuperAdmin   System-wide. Manages all businesses. Not tenant-scoped.
  Admin        Full access to their own business.
  Manager      Most features. Cannot edit COA or system settings.
  Cashier      POS and view-only on sales. max_discount enforced.
  Accountant   Journals, COA, financial reports only.
  HR           HRM module only (when enabled).

Business rules:
  - Admin or Manager can create users
  - Soft delete only — records the user created are preserved
  - Admin cannot delete themselves or the last Admin in the business
  - max_discount on user: limits the maximum % discount a cashier can apply on POS
  - Invitation email sent on user creation — user sets their own password

API:
  GET    /api/v1/users                  Auth+perm
  POST   /api/v1/users                  Admin/Mgr
  GET    /api/v1/users/{id}             Auth+perm
  PUT    /api/v1/users/{id}             Admin/Mgr
  DELETE /api/v1/users/{id}             Admin
  POST   /api/v1/users/{id}/roles       Admin
  POST   /api/v1/users/{id}/invite      Admin


### Feature 3 — BUSINESS / TENANT SETUP


What it does:
  The Business record is the root of all tenant data.
  Every table has business_id. Settings are seeded on business creation.

Stock-related settings seeded:
  stock.enable_lot_tracking         false
  stock.enable_serial_tracking      false
  stock.lot_expiry_alert_days       30
  stock.default_lot_selection       fefo   (First Expired First Out — safest default)

API:
  GET    /api/v1/businesses/me
  PUT    /api/v1/businesses/me
  GET    /api/v1/branches             + POST + PUT + DELETE
  GET    /api/v1/warehouses           + POST + PUT + DELETE
  GET    /api/v1/settings             + GET /{group} + PUT (batch)


### Feature 4 — TAX MANAGEMENT


  Tax rates per business. Compound groups. Inclusive or exclusive.
  Snapshot stored on each transaction line — rate changes don't affect history.

API:
  GET/POST/PUT/DELETE  /api/v1/tax-rates
  GET/POST/PUT/DELETE  /api/v1/tax-groups


### Feature 5 — CUSTOMERS


Business rules:
  - Code: CUST-00001 (configurable prefix)
  - Customer groups: discount + optional price group
  - balance = SUM(total - paid) from sales — computed, never stored
  - reward_points = SUM(points) from loyalty_transactions — computed
  - FULLTEXT search for POS typeahead
  - Up to 4 configurable custom fields per business

API:
  GET/POST/PUT/DELETE  /api/v1/customers
  GET    /api/v1/customers/{id}/ledger
  GET    /api/v1/customers/search          FULLTEXT POS search
  POST   /api/v1/customers/import          CSV
  GET/POST/PUT/DELETE  /api/v1/customer-groups


### Feature 6 — SUPPLIERS


Business rules:
  - Code: SUPP-00001
  - balance = SUM(total - paid) from purchases — computed
  - Soft delete only

API:
  GET/POST/PUT/DELETE  /api/v1/suppliers
  GET    /api/v1/suppliers/{id}/ledger
  POST   /api/v1/suppliers/import


### Feature 7 — CATALOG (Products)


What it does: Manages all products. Four types: single, variable, service, combo.

Key additions in v4:
  - products.stock_tracking field: none | lot | serial
  - Changing stock_tracking is blocked if the product already has stock movements
  - For lot-tracked products: has_expiry is auto-set to 1
  - For serial-tracked products: alert_quantity is not used (count serials instead)

Business rules (same as v3, plus):
  - stock_tracking = none: standard qty-based tracking (default)
  - stock_tracking = lot:  must provide lot details when receiving stock
  - stock_tracking = serial: must scan or enter serial numbers when receiving
  - Combo products: if a component is lot/serial tracked, the cashier must
    select lot/serials for the combo just as they would for the component directly

API:
  GET/POST/PUT/DELETE  /api/v1/catalog/products
  GET  /api/v1/catalog/products/search        FULLTEXT
  POST /api/v1/catalog/products/import
  POST /api/v1/catalog/products/bulk-update
  GET  /api/v1/catalog/products/{id}/lots     Available lots for this product
  GET  /api/v1/catalog/products/{id}/serials  Serial numbers for this product
  + categories, brands, units, sub_units, variation-templates, price-groups


### Feature 8 — INVENTORY (Stock Management)


CRITICAL: Stock is never updated directly. StockMovementService only.

  ════════════════════════════════════════════════════════════════
  STOCK MODE = none (quantity only)
  ════════════════════════════════════════════════════════════════

  All existing v3 behavior applies:
  - Every change writes to stock_movements (ledger)
  - stock_levels holds current qty and reserved_qty
  - available_qty is a GENERATED COLUMN

  ════════════════════════════════════════════════════════════════
  STOCK MODE = lot
  ════════════════════════════════════════════════════════════════

  Receiving stock (purchase_receive):
    - Cashier enters: lot_number, expiry_date, quantity, unit_cost per lot
    - Multiple lots can be received in one receive event
    - Each lot creates/updates a stock_lots row
    - A stock_movements row is created (type = purchase_receipt, lot_id set)
    - stock_levels.quantity is updated

  Selling stock (sale confirm/complete):
    On CONFIRM:
      - System suggests lots based on selection strategy (FIFO or FEFO)
      - User can override and pick a different lot manually
      - A sale_item_lots row is created (or multiple if spanning lots)
      - stock_lots.qty_reserved increases
      - stock_levels.reserved_quantity increases

    On COMPLETE:
      - stock_lots.qty_on_hand decreases for each lot used
      - stock_levels.quantity decreases
      - stock_movements row created (type = sale, lot_id set)

    On CANCEL:
      - stock_lots.qty_reserved decreases
      - stock_levels.reserved_quantity decreases

  Lot selection strategies:
    FIFO (First In First Out): oldest received_at lot selected first
    FEFO (First Expired First Out): nearest expiry_date lot selected first
         — safer for perishables — prevents expired stock being left behind
    Manual: cashier sees the lot list and chooses which to sell from

  Expiry alerts:
    - Daily scheduler job checks stock_lots WHERE status=active
      AND expiry_date <= (today + lot_expiry_alert_days)
    - Sends email notification to Admin
    - Creates in-app notification

  Lot status auto-transitions:
    - depleted: qty_on_hand reaches 0 (auto-updated by StockMovementService)
    - expired: daily job sets status=expired when expiry_date < today
    - recalled / quarantine: manual admin action only

  ════════════════════════════════════════════════════════════════
  STOCK MODE = serial
  ════════════════════════════════════════════════════════════════

  Receiving stock (purchase_receive):
    - Cashier scans or manually enters each serial number
    - Each serial creates a stock_serials row (status = in_stock)
    - quantity on purchase_receive_item = number of serials entered
    - A stock_movements row is created per serial (quantity = 1)
    - Duplicate serial_number within same business throws an exception

  Selling stock (sale confirm/complete):
    On CONFIRM:
      - Cashier scans or selects each serial number to be sold
      - COUNT(selected serials) must match sale_item.quantity
      - sale_item_serials rows are created
      - stock_serials.status → reserved for each selected serial
      - stock_levels.reserved_quantity increases

    On COMPLETE:
      - stock_serials.status → sold, sold_at timestamp set
      - stock_serials.sale_item_id set
      - stock_serials.warehouse_id set to null (no longer in any warehouse)
      - stock_levels.quantity decreases
      - stock_movements row created (type = sale, serial_id set, qty = 1)

    On CANCEL:
      - stock_serials.status → in_stock (back to available)
      - stock_levels.reserved_quantity decreases

  Serial return:
    - Cashier selects which serial numbers are being returned
    - stock_serials.status → returned, then → in_stock (back to warehouse)
    - stock_serials.warehouse_id restored
    - stock_movements row created (type = sale_return)

  Serial lookup:
    - Search any serial number across the business → see its full history
    - Which purchase it came from, which sale it went to, all movements
    - Useful for warranty claims and after-sale service

  Stock count with serials:
    - System shows all in_stock serials for the warehouse
    - Staff marks each as found or missing
    - Missing serials generate adjustment_out movements
    - Extra (unknown) serials generate new stock_serials rows + adjustment_in

StockMovementService method signatures:

  createMovement(type, product, warehouse, qty, cost, reference, options):
    options can contain: lot_id, serial_id, notes
    Validates:
      - If product.stock_tracking = lot → lot_id required
      - If product.stock_tracking = serial → serial_id required, qty must = 1
      - Available qty check before any outbound movement

  reserveStock(sale):
    For each sale_item:
      If none:    stock_levels.reserved_quantity += qty
      If lot:     Calls selectLots(product, warehouse, qty, strategy)
                  Creates sale_item_lots rows
                  stock_lots.qty_reserved += lot_qty for each lot
                  stock_levels.reserved_quantity += total_qty
      If serial:  Validates all serial_ids are in_stock
                  stock_serials.status → reserved for each
                  stock_levels.reserved_quantity += count(serials)

  deductStock(sale):
    For each sale_item:
      If none:    stock_levels.quantity -= qty, reservation released
      If lot:     stock_lots.qty_on_hand -= lot_qty for each lot in sale_item_lots
                  stock_lots.qty_reserved -= lot_qty
                  stock_levels.quantity -= total_qty, reservation released
                  Auto-set lot.status = depleted if qty_on_hand = 0
      If serial:  stock_serials.status → sold, sold_at = now()
                  stock_serials.warehouse_id = null
                  stock_levels.quantity -= count(serials)

  selectLots(product, warehouse, qty, strategy):
    Returns a list of { lot_id, quantity } that totals the requested qty.
    Filters: status = active, qty_available > 0.
    Sorts by: received_at ASC (FIFO) or expiry_date ASC (FEFO).
    If manual: returns available lots for user to choose from.
    Throws InsufficientStockException if total available < qty.

API endpoints (Inventory):
  GET   /api/v1/inventory/stock                      Current levels per product/warehouse
  GET   /api/v1/inventory/stock/low                  Below alert_quantity (none-mode)
  GET   /api/v1/inventory/movements                  History, paginated
  POST  /api/v1/inventory/adjustments                Manual adj (includes lot/serial)
  POST  /api/v1/inventory/transfers                  Between warehouses (lot/serial aware)
  GET   /api/v1/inventory/lots                       All lots with filters
  GET   /api/v1/inventory/lots/{id}                  Lot detail + movement history
  PUT   /api/v1/inventory/lots/{id}/status           Update lot status (recall, quarantine)
  GET   /api/v1/inventory/lots/expiring              Lots expiring in next N days
  GET   /api/v1/inventory/serials                    Search serials (by number, product, status)
  GET   /api/v1/inventory/serials/{id}               Serial detail + full history
  PUT   /api/v1/inventory/serials/{id}/write-off     Mark serial as written off
  GET   /api/v1/inventory/stock-counts               List counts
  POST  /api/v1/inventory/stock-counts               Start new count
  GET   /api/v1/inventory/stock-counts/{id}          Count detail
  PUT   /api/v1/inventory/stock-counts/{id}          Enter counted quantities
  POST  /api/v1/inventory/stock-counts/{id}/complete Finalize + auto-adjust
  POST  /api/v1/inventory/barcode-labels             Generate label PDF


### Feature 9 — SALES & POS


What it does:
  Core revenue feature. POS, invoices, quotations, drafts, suspended sales,
  returns, and cash register management.

Sale state machine (unchanged from v3):
  draft → confirmed → completed → returned
  draft | confirmed → cancelled
  quotation → converted | expired | cancelled
  suspended → confirmed | cancelled

Key v4 additions for Lot/Serial on POS:

  For lot-tracked products:
    - After adding to cart, a lot selection panel appears
    - System auto-suggests lots by the business strategy (FIFO/FEFO/Manual)
    - Cashier can see: lot_number, expiry_date, available_qty per lot
    - Cashier can override the suggestion and choose a different lot
    - If one lot doesn't have enough qty, system spans into the next lot
    - The selected lot(s) are shown in the cart line

  For serial-tracked products:
    - After adding to cart, a serial number input appears
    - Cashier scans barcode or types serial number
    - System validates: serial exists, is in_stock, is in the right warehouse
    - Each scanned serial populates a serial chip in the cart line
    - Scan count must equal the quantity on the line
    - Cannot complete the sale until all serials are confirmed

  On POS COMPLETE with lot/serial:
    - sale_item_lots rows created with lot_id + quantity
    - sale_item_serials rows created with serial_id
    - StockMovementService.deductStock() handles all lot/serial updates

  Sale return with lot/serial:
    For lot: cashier selects which lot the returned items go back to
             (usually the same lot they were sold from, shown in history)
    For serial: cashier scans or enters the serial numbers being returned
                stock_serials.status → returned → in_stock

Full POS screen features:
  - Product search: FULLTEXT (name, SKU, barcode)
  - USB barcode scanner via keydown event
  - Category filter buttons
  - Customer typeahead + quick-add modal
  - Price group auto-apply from customer
  - Cart: qty, line discount, sub-unit toggle
  - Lot selection panel (when stock_tracking = lot)
  - Serial scan panel (when stock_tracking = serial)
  - Multiple payment methods: cash + card + bank
  - Cash change calculation
  - Loyalty point redemption
  - Hold / suspend sale
  - Print receipt (browser or thermal)
  - Open / close cash register

API:
  GET/POST  /api/v1/sales
  POST      /api/v1/sales/{id}/confirm
  POST      /api/v1/sales/{id}/complete
  POST      /api/v1/sales/{id}/cancel
  POST      /api/v1/sales/{id}/return
  GET       /api/v1/sales/{id}/invoice     PDF
  POST      /api/v1/sales/pos              One-step POS complete
  GET/POST  /api/v1/quotations
  POST      /api/v1/quotations/{id}/convert
  GET/POST  /api/v1/cash-registers
  POST      /api/v1/cash-registers/{id}/open
  POST      /api/v1/cash-registers/{id}/close


### Feature 10 — PURCHASES


What it does: POs to suppliers. Receive goods (partial ok). Return goods.

Key v4 additions:
  - When receiving a lot-tracked product: enter lot_number, expiry_date, qty per lot
  - When receiving a serial-tracked product: enter each serial number
  - purchase_receive_lots rows created per lot
  - purchase_receive_serials rows created per serial
  - StockMovementService creates stock_lots or stock_serials records on receive

Purchase states:
  draft → ordered → partial_received → received → [terminal]
  draft | ordered → cancelled

API:
  GET/POST  /api/v1/purchases
  GET/PUT   /api/v1/purchases/{id}
  POST      /api/v1/purchases/{id}/send
  POST      /api/v1/purchases/{id}/receive    — includes lot/serial data in body
  POST      /api/v1/purchases/{id}/cancel
  POST      /api/v1/purchases/{id}/return
  GET       /api/v1/purchases/{id}/pdf

  Receive request body for lot-tracked product:
    {
      "warehouse_id": "...",
      "items": [
        {
          "purchase_item_id": "...",
          "lots": [
            { "lot_number": "L2024-0001", "expiry_date": "2026-12-31",
              "quantity": 50, "unit_cost": 5.20 },
            { "lot_number": "L2024-0002", "expiry_date": "2027-06-30",
              "quantity": 30, "unit_cost": 5.25 }
          ]
        }
      ]
    }

  Receive request body for serial-tracked product:
    {
      "warehouse_id": "...",
      "items": [
        {
          "purchase_item_id": "...",
          "serials": [
            { "serial_number": "SN-A0001", "warranty_expires": "2027-01-01" },
            { "serial_number": "SN-A0002", "warranty_expires": "2027-01-01" }
          ]
        }
      ]
    }


### Feature 11 — ACCOUNTING (Double-Entry)


CRITICAL: Build before Sales and Purchases.
journal_entries is append-only — reverse to correct, never delete.

Chart of Accounts seeded on business creation:
  1000 Cash and Bank        | Asset (cash)
  1001 Petty Cash           | Asset (cash)
  1100 Accounts Receivable  | Asset (current)
  1200 Inventory            | Asset (current)
  1300 Other Current Assets | Asset (current)
  1400 Fixed Assets         | Asset (fixed)
  2000 Accounts Payable     | Liability (current)
  2100 Tax Payable          | Liability (current)
  2200 Other Current Liab.  | Liability (current)
  2300 Long-Term Debt       | Liability (long_term)
  3000 Owner Capital        | Equity
  3100 Retained Earnings    | Equity
  4000 Sales Revenue        | Revenue
  4100 Sales Returns        | Revenue (contra)
  4200 Other Income         | Revenue
  5000 Cost of Goods Sold   | Expense (cogs)
  5100 Purchase Returns     | Expense (contra)
  6000 Operating Expenses   | Expense
  6100 Salary Expense       | Expense
  6200 Rent Expense         | Expense
  6300 Utility Expense      | Expense
  6900 Other Expenses       | Expense

Auto-posted journals:
  Sale completed (cash)     DR 1000 Cash            CR 4000 Sales Revenue
  Sale completed (credit)   DR 1100 AR              CR 4000 Sales Revenue
  COGS on sale              DR 5000 COGS            CR 1200 Inventory
  Sale return (cash)        DR 4100 Sale Returns    CR 1000 Cash
  Purchase received         DR 1200 Inventory       CR 2000 AP
  Purchase return           DR 2000 AP              CR 5100 Purchase Returns
  Customer payment          DR 1000 Cash            CR 1100 AR
  Supplier payment          DR 2000 AP              CR 1000 Cash
  Expense                   DR 6xxx Expense         CR 1000 Cash

API:
  GET/POST/PUT  /api/v1/accounting/accounts
  GET/POST  /api/v1/accounting/journals
  POST      /api/v1/accounting/journals/{id}/reverse
  GET       /api/v1/accounting/trial-balance
  GET       /api/v1/accounting/profit-loss
  GET       /api/v1/accounting/balance-sheet
  GET/POST/PUT  /api/v1/payment-accounts
  POST      /api/v1/payment-accounts/transfer


### Feature 12 — PAYMENTS


  Records payments against sales or purchases.
  Auto-posts accounting journal on every payment.
  Installment plans auto-generate schedule rows.

API:
  POST/GET  /api/v1/sale-payments
  POST      /api/v1/sale-payments/{id}/reverse
  POST/GET  /api/v1/purchase-payments
  POST      /api/v1/purchase-payments/{id}/reverse
  POST/GET  /api/v1/installment-plans
  POST      /api/v1/installment-plans/{id}/pay/{sid}


### Feature 13 — EXPENSES


  Operating costs linked to COA + payment accounts.
  Every expense auto-posts a journal.
  Recurring expense support.

API:
  GET/POST/PUT/DELETE  /api/v1/expenses
  GET/POST/PUT/DELETE  /api/v1/expense-categories


### Feature 14 — LOYALTY POINTS


  Earn on sale completion. Redeem on POS payment.
  Full history in loyalty_transactions (append-only).
  Daily scheduler expires old points.

API:
  GET/PUT   /api/v1/loyalty/settings
  GET       /api/v1/customers/{id}/loyalty
  POST      /api/v1/customers/{id}/loyalty/adjust


### Feature 15 — BARCODE LABELS


  Generate printable sticker sheets for any products.
  Supports Code 128, EAN-13, QR.
  For lot-tracked products: can include lot_number + expiry_date on label.
  For serial-tracked products: print one label per serial number.

API:
  POST  /api/v1/inventory/barcode-labels    Body: [{ product_id, quantity, lot_id?, serial_id? }]


### Feature 16 — NOTIFICATIONS


  Automated alerts by queue jobs. Email and in-app bell.

Notification types:
  Type                       Trigger                               Channel
  -------------------------  ------------------------------------  ---------------
  low_stock_alert            available_qty < alert_quantity        Email to Admin
  lot_expiry_alert           lot.expiry_date <= today + N days     Email to Admin
  lot_expired                lot.expiry_date < today               In-app
  lot_recalled               Admin marks lot as recalled           In-app
  sale_payment_due           sale due in X days                    Email to customer
  purchase_payment_due       purchase due in X days                Email to Admin
  installment_overdue        schedule row past due_date            Email to Admin
  quotation_expired          quotation expiry_date reached         In-app

In-app bell:
  - Unread count badge on SmartAdmin topbar
  - Last 10 notifications in dropdown
  - Mark as read individually or all at once

API:
  GET   /api/v1/notifications
  PUT   /api/v1/notifications/{id}/read
  POST  /api/v1/notifications/read-all
  GET   /api/v1/notifications/unread-count


### Feature 17 — REPORTS & DASHBOARD


Dashboard KPIs (cached in Redis, 5-min TTL):
  - Revenue: today / this month / this year
  - Purchases: today / this month / this year
  - Gross profit this month
  - Outstanding receivables
  - Outstanding payables
  - Cash on hand
  - Low stock count
  - Expiring lots in next 30 days (count)
  - Top 5 products by revenue
  - Recent 10 transactions
  - Revenue vs Purchases bar chart (12 months)
  - Sales trend line (30 days)

Full report list (all exportable to Excel):
  Sales Report               date, branch, customer, status, payment_status
  Sales Return Report        date, branch, customer
  Purchases Report           date, branch, supplier, status, payment_status
  Purchase Return Report     date, branch, supplier
  Sale Payments Report       date, method, cashier, payment_account
  Purchase Payments Report   date, method, payment_account
  Stock Report               warehouse, product, category (includes lot summary)
  Stock Movement Report      type, warehouse, product, date, lot_number, serial
  Low Stock Report           products below alert_quantity
  Stock Value Report         current stock × purchase_price and × selling_price
  Lot Report                 all lots — filter by: product, warehouse, status,
                             expiry range, lot_number; shows qty remaining
  Lot Expiry Report          lots expiring within N days (configurable)
  Serial Number Report       search/filter by serial, product, status;
                             shows purchase date, sale date, warranty expiry
  Product Sales Report       qty sold, revenue, cost, profit per product
  Trending Products Report   top N products by qty or revenue
  Customer Ledger            all transactions + running balance
  Supplier Ledger            all transactions + running balance
  Receivables Aging          0-30 / 31-60 / 61-90 / 90+ days
  Payables Aging             same buckets
  Expense Report             date, category, branch
  Cash Register Report       per session: opening, sales, closing, difference
  Tax Report                 output tax vs input tax by period
  Profit & Loss              revenue - COGS - expenses = net profit
  Balance Sheet              assets = liabilities + equity
  Trial Balance              all COA accounts debit/credit
  Loyalty Points Report      earned, redeemed, balance per customer

API:
  GET  /api/v1/reports/dashboard
  GET  /api/v1/reports/sales | sales-returns | purchases | purchase-returns
  GET  /api/v1/reports/sale-payments | purchase-payments
  GET  /api/v1/reports/stock | stock-movements | stock-value | low-stock
  GET  /api/v1/reports/lots                      Lot report
  GET  /api/v1/reports/lots-expiry               Expiry report
  GET  /api/v1/reports/serials                   Serial number report
  GET  /api/v1/reports/product-sales | trending
  GET  /api/v1/reports/customer-ledger/{id} | supplier-ledger/{id}
  GET  /api/v1/reports/receivables-aging | payables-aging
  GET  /api/v1/reports/expenses | cash-register | tax
  GET  /api/v1/reports/profit-loss | balance-sheet | trial-balance
  GET  /api/v1/reports/loyalty
  GET  /api/v1/reports/*/export                  Any report → Excel


### Feature 18 — HRM MODULE (Modules/HRM/)


What it does:
  HR management. Optional — disabled for clients that don't need it.
  Uses all base classes from app/ — no code duplication.

Employees, Departments, Designations, Attendance, Leave, Payroll.

API (prefix /api/v1/hrm/):
  GET/POST/PUT    /api/v1/hrm/employees
  GET/POST/PUT    /api/v1/hrm/departments
  GET/POST        /api/v1/hrm/designations
  POST            /api/v1/hrm/attendance/checkin | checkout
  GET             /api/v1/hrm/attendance | attendance/report/{id}
  GET/POST        /api/v1/hrm/leave-types
  GET/POST        /api/v1/hrm/leave-requests
  PUT             /api/v1/hrm/leave-requests/{id}/approve | reject
  GET             /api/v1/hrm/leave-balances/{id}
  POST/GET        /api/v1/hrm/payroll
  PUT             /api/v1/hrm/payroll/{id}/finalize
  GET             /api/v1/hrm/payroll/{id}/export | payslip/{eid}


### Feature 19 — SETTINGS (Detailed)


  All groups and keys:


**`general:`**
    currency, timezone, date_format, decimal_places,
    thousand_separator, financial_year_start, country


**`invoice:`**
    prefix (INV), start_number (1), footer_note, terms_conditions,
    show_tax, show_discount, show_logo, show_barcode, custom_fields


**`tax:`**
    default_tax_rate_id, default_tax_type (exclusive)


**`pos:`**
    default_warehouse_id, default_price_group_id, allow_negative_stock,
    require_customer, allow_discount, max_discount_pct,
    receipt_printer (browser | thermal), show_featured_products,
    enable_service_staff, lot_selection_strategy (fifo | fefo | manual)


**`stock:`**
    enable_lot_tracking (false), enable_serial_tracking (false),
    lot_expiry_alert_days (30), default_lot_selection (fefo)


**`email:`**
    driver, host, port, username, from_address, from_name


**`notifications:`**
    low_stock_threshold, payment_due_reminder_days,
    lot_expiry_alert_days


**`loyalty:`**
    is_active (false)


## SECTION 4 — API RESPONSE FORMAT


Success — single:
  { "success": true, "message": "OK", "data": { ...item } }

Success — paginated:
  { "success": true, "data": [...], "meta": { current_page, per_page, total, last_page, from, to } }

Validation error (422):
  { "success": false, "message": "Validation failed.", "errors": { "field": ["msg"] } }

Business logic error (400):
  { "success": false, "message": "This lot has insufficient available quantity." }

Unauthorized (401): { "success": false, "message": "Unauthenticated." }
Forbidden (403):    { "success": false, "message": "You do not have permission." }
Not found (404):    { "success": false, "message": "Record not found." }
Server error (500): { "success": false, "message": "An unexpected error occurred." }


## SECTION 5 — BASE CLASSES


BaseModel (app/Models/BaseModel.php):
  Uses: HasUuid, BelongsToTenant, HasUserTracking, SoftDeletes
  $guarded = ['id', 'created_at', 'updated_at', 'deleted_at']

HasUuid:        Auto-generates UUID on creating. getIncrementing()=false.
BelongsToTenant: Global scope WHERE business_id = app('tenant')->id.
                 Auto-sets business_id on creating.
HasUserTracking: Sets created_by and updated_by from auth()->id().

BaseApiController:
  success($data, $msg='OK', $code=200): JsonResponse
  paginated(LengthAwarePaginator $p, $resource): JsonResponse
  error($msg, $code=400): JsonResponse

BaseRepository:
  find($id, $with=[])   → Redis cache first (key: repo:{business_id}:{table}:{id})
  findOrFail($id)
  create($data)         → busts cache
  update($id, $data)    → busts cache
  delete($id)           → soft delete + busts cache

Domain Exceptions (app/Exceptions/Domain/):
  InsufficientStockException       — thrown when available_qty < requested qty
  InsufficientLotQtyException      — thrown when lot.qty_available < requested
  SerialNotFoundException           — serial number not found in this warehouse
  SerialAlreadySoldException        — serial is not in_stock status
  DuplicateSerialException         — serial_number already exists in this business
  InvalidStateTransitionException  — sale/purchase state machine violation
  UnbalancedJournalException       — sum(debit) != sum(credit)
  LotExpiredException              — lot.status = expired, cannot sell
  LotRecalledException             — lot.status = recalled, cannot sell


## SECTION 6 — MARIADB PERFORMANCE NOTES


GENERATED COLUMNS (avoid computed value drift):
  stock_levels.available_qty:    GENERATED AS (quantity - reserved_quantity) STORED
  stock_lots.qty_available:      GENERATED AS (qty_on_hand - qty_reserved) STORED
  stock_count_items.difference:  GENERATED AS (counted_quantity - system_quantity) STORED
  leave_balances.remaining_days: GENERATED AS (total_days - used_days) STORED

FULLTEXT INDEXES:
  products:  FULLTEXT(name, sku, barcode)
  customers: FULLTEXT(name, email, phone, mobile)
  stock_lots: INDEX(business_id, lot_number) — partial FULLTEXT if needed
  stock_serials: UNIQUE(business_id, serial_number) — direct lookup

KEY PERFORMANCE INDEXES beyond standard FKs:
  sales:                 INDEX(business_id, status, created_at)
                         INDEX(business_id, payment_status, due_date)
  purchases:             INDEX(business_id, payment_status)
  stock_movements:       INDEX(product_id, warehouse_id, created_at)
  stock_lots:            INDEX(product_id, warehouse_id, received_at)   FIFO
                         INDEX(product_id, warehouse_id, expiry_date)   FEFO
                         INDEX(business_id, expiry_date)                expiry job
  stock_serials:         INDEX(product_id, warehouse_id, status)
  installment_schedules: INDEX(status, due_date)
  loyalty_transactions:  INDEX(customer_id, created_at)

Redis caching strategy:
  Dashboard KPIs:        TTL 5 min   key: dashboard:{business_id}
  Product search cache:  TTL 10 min  key: products:search:{business_id}:{hash}
  Settings:              No TTL      key: settings:{business_id}  (bust on change)
  User permissions:      No TTL      key: perms:{user_id}  (bust on role change)
  COA tree:              No TTL      key: coa:{business_id}  (bust on account change)
  Available lots:        TTL 2 min   key: lots:{product_id}:{warehouse_id}  (bust on movement)


## SECTION 7 — FRONTEND ARCHITECTURE (SmartAdmin 4.5.1 + Vue 3)


Blade + Vue integration pattern:
  1. Browser requests URL (e.g. GET /inventory/lots)
  2. Laravel Web Controller returns Blade view — zero DB queries
  3. Blade renders SmartAdmin layout + <div id="app">
  4. Vite loads the page's index.js
  5. Vue 3 mounts into div, calls API via Axios
  6. API returns JSON, Vue renders UI

Shared Vue components (resources/js/components/ui/):
  DataTable.vue       SmartAdmin .table with sort/paginate
  AppModal.vue        Bootstrap .modal wrapper
  AppPagination.vue   .pagination component
  SearchInput.vue     .input-group with search icon
  StatusBadge.vue     .badge .badge-pill color-coded
  ConfirmDelete.vue   Delete confirmation modal
  AppAlert.vue        .alert .alert-dismissible
  LoadingSpinner.vue  SmartAdmin loading overlay

Inventory-specific Vue components:
  LotSelector.vue     Lot selection panel for POS/sale lines
                        Shows: lot_number, expiry_date, qty_available, unit_cost
                        Supports auto-selection (FIFO/FEFO) + manual override
                        Multi-lot spanning when one lot doesn't cover the qty
  SerialScanner.vue   Serial number scan/entry panel for POS/sale lines
                        Shows scan input, list of scanned serials, remove button
                        Validates each serial via API before adding to list
  LotBadge.vue        Inline lot chip shown in cart and sale detail
  SerialChip.vue      Inline serial chip shown in cart and sale detail

Pinia store pattern per page:
  Each page has its own store with: list, selectedItem, pagination, loading, error, filters
  All axios calls are in the api/ service file — imported only by the store
  Components call store actions only — never axios directly

VITE CONFIG (auto-discovers all page entry points):
  const pages = readdirSync("resources/js/pages")
    .filter(d => existsSync(`resources/js/pages/${d}/index.js`))
    .map(d => `resources/js/pages/${d}/index.js`)
  const hrmPages = readdirSync("Modules/HRM/Resources/js/pages")
    ...
  export default defineConfig({
    plugins: [laravel({ input: [...pages, ...hrmPages], refresh: true }), vue()],
    resolve: { alias: { "@": "/resources/js", "@comps": "/resources/js/components" } }
  })


## SECTION 8 — BUILD PHASES (26 Weeks)


Legend: [CRITICAL] = cannot be skipped, everything after depends on it


## Phase 1 — ENVIRONMENT & FOUNDATION  (Weeks 1–4)


1.1  Docker: MariaDB 10.11, Redis 7, phpMyAdmin, MailHog
     Done: All containers running. Laravel connects to MariaDB.

1.2  Laravel 11 + Composer packages:
     nwidart/laravel-modules, laravel/sanctum, laravel/octane,
     spatie/laravel-permission, spatie/laravel-medialibrary,
     barryvdh/laravel-dompdf, maatwebsite/excel, darkaonline/l5-swagger
     Done: composer install clean.

1.3  npm packages + Vite aliases:
     vue, pinia, axios, @vitejs/plugin-vue, vee-validate, chart.js, vue-chartjs
     Done: npm run dev compiles.

1.4  SmartAdmin 4.5.1 assets → public/smartadmin/
     Done: Layout loads in browser with sidebar and topbar.

1.5  php artisan module:make HRM
     Done: Modules/HRM/ exists.

1.6  [CRITICAL] BaseModel + HasUuid + BelongsToTenant + HasUserTracking
     Done: Tenant scope unit tested. UUID auto-generated.

1.7  [CRITICAL] BaseApiController: success / paginated / error
     Done: All 3 return correct JSON envelopes.

1.8  [CRITICAL] BaseRepository: CRUD + Redis cache (tenant-scoped keys)
     Done: Cache per tenant verified. Busted on write.

1.9  [CRITICAL] Global Exception Handler → always JSON, never HTML
     Done: 404, 422, 500 all return { success: false }.

1.10 [CRITICAL] TenantResolver middleware → sets app('tenant')
     Done: app('tenant') returns Business on every authenticated request.

1.11 [CRITICAL] Domain Exceptions (app/Exceptions/Domain/):
     InsufficientStockException, InsufficientLotQtyException,
     SerialNotFoundException, SerialAlreadySoldException,
     DuplicateSerialException, InvalidStateTransitionException,
     UnbalancedJournalException, LotExpiredException, LotRecalledException
     Done: All exceptions extend a base DomainException.

1.12 Group A migrations: businesses, branches, warehouses, users,
     spatie tables, settings (with stock group), audit_logs
     Done: All tables with GENERATED COLUMNS where applicable.

1.13 Seed 6 roles. Seed default settings including stock settings.
     Done: 6 roles. Default settings in DB and Redis.

1.14 Auth: login, logout, me, password, forgot, reset
     Done: Login returns cookie + user + roles + permissions.

1.15 Users: service + controller + Vue page
     Done: Full user management. Invite email works.

1.16 Tenant: Business, Branch, Warehouse APIs + Vue pages
     Done: All CRUD with tenant isolation.

1.17 Settings: API + Vue page (all groups including stock group)
     Done: Settings save, load, cached in Redis.

1.18 8 shared Vue components (SmartAdmin-styled)
     Done: All 8 usable across all pages.


## Phase 2 — TAX, CONTACTS & CATALOG  (Weeks 5–7)


2.1  Tax rates + tax groups: migrations, models, services, API, Vue
     Done: Can create VAT 10%, compound CGST+SGST.

2.2  Group C migrations: customer_groups, customers (FULLTEXT), suppliers
     CustomerService + Controller + FULLTEXT search
     Customer Vue page: list, create, edit, ledger, CSV import
     Customer groups: service + API + Vue
     SupplierService + Controller + Vue page
     Done: FULLTEXT search verified fast on 10k rows.

2.3  Group D migrations: all 12 catalog tables
     All catalog models. FULLTEXT on products.
     Category + Brand + Unit + SubUnit + VariationTemplate services + APIs
     ProductService:
       - create() for all 4 types
       - Validate stock_tracking is not changed if movements exist
       - Auto-set has_expiry=1 when stock_tracking=lot
       - CSV import with row-level validation
     ProductController: all endpoints including lots/serials sub-resources
     Products Vue page: all 4 product types, images, stock_tracking selector
     Price groups: service + API + Vue
     Done: All product types. stock_tracking field locked after first movement.


## Phase 3 — INVENTORY  (Weeks 8–10)


3.1  [CRITICAL] Group E migrations:
       stock_movements (lot_id, serial_id columns)
       stock_levels (GENERATED available_qty)
       stock_lots (GENERATED qty_available, all indexes)
       stock_serials (UNIQUE serial per business, all indexes)
       stock_counts, stock_count_items (GENERATED difference)
       stock_count_serials
     Done: All tables. GENERATED COLUMNS verified in MariaDB.

3.2  [CRITICAL] Models:
       StockMovement (no updated_at), StockLevel, StockLot,
       StockSerial (state machine methods), StockCount
     Done: Models correct. StockLot.status state machine documented.

3.3  [CRITICAL] StockMovementService — complete implementation:
       createMovement(type, product, warehouse, qty, cost, reference, options)
       reserveStock(sale) — handles none | lot | serial modes
       releaseReservation(sale)
       deductStock(sale) — handles none | lot | serial modes
       transferStock(from, to, product, qty, lotOrSerial)
       checkAvailability(product, warehouse, qty, lotId?)
       selectLots(product, warehouse, qty, strategy) — FIFO | FEFO | manual
       returnToStock(saleReturn) — restores lots + serial states
     Done: All 10 movement types work. Lot spanning (multi-lot per line) works.
           Serial validation prevents duplicate and non-in_stock usage.
           DB::transaction() wraps every multi-step operation.

3.4  Inventory Vue pages:
       Stock levels: list by warehouse + product + mode indicator
       Adjustments: modal supports none | lot | serial products
       Transfers: warehouse-to-warehouse (lot and serial aware)
       Movement history: filter by type, product, lot, serial, date
       Lot management page: list, filter by expiry/status, update status
       Serial management page: search by serial number, view history
       Stock count: start count, enter quantities / scan serials, finalize
       Barcode labels: generate PDF (supports lot + serial on label)
     Done: Full inventory management for all 3 modes in browser.

3.5  LotSelector.vue + SerialScanner.vue components
     Done: Both components reusable in POS and invoice sale pages.


## Phase 4 — ACCOUNTING  (Week 11) [BEFORE SALES]


4.1  [CRITICAL] Group H migrations:
       payment_accounts, account_transactions,
       chart_of_accounts, fiscal_years,
       journals, journal_entries (NO updated_at)
     Done: GENERATED COLUMNS. UnbalancedJournalException unit tested.

4.2  [CRITICAL] AccountingService:
       postJournal, reverseJournal, validateBalance,
       postSaleJournal, postPurchaseJournal,
       postPaymentJournal, postExpenseJournal
     Done: sum(debit)==sum(credit) enforced before any DB write.

4.3  [CRITICAL] Business::created event → seed 21 COA accounts
     Done: New business has complete working COA immediately.

4.4  AccountingController + PaymentAccountController
     COA Vue page + Journal list Vue page + Payment accounts Vue page
     Done: All accounting endpoints. COA tree renders.

4.5  Tax rates + groups: service, API, Vue page
     Done: Compound taxes work. Tax groups assign to products.


## Phase 5 — SALES & POS  (Weeks 12–15)


5.1  [CRITICAL] Group F migrations:
       sales, sale_items, sale_payments, sale_returns, sale_return_items,
       sale_item_lots, sale_item_serials,
       cash_registers, cash_register_sessions
     Done: All tables with indexes.

5.2  Sale + SaleItem + SalePayment models with state machine
     LotSelector and SerialScanner integrated into cart item component
     Done: State methods work. LotSelector renders correct lots.

5.3  [CRITICAL] SaleService:
       create, confirm (reserveStock — lot/serial aware),
       complete (deductStock — lot/serial aware + postSaleJournal),
       cancel (releaseReservation), processReturn (returnToStock)
     Done: Full lifecycle. Lot spanning works. Serial validation blocks
           double-selling. DB::transaction() wraps all multi-step ops.

5.4  SaleController + QuotationService + CashRegisterService
     Done: All endpoints work.

5.5  Invoice PDF: lot numbers and serial numbers shown on invoice line items
     Done: PDF includes lot/serial detail per line.

5.6  Sales list Vue page: filters, payment modal, return modal
     POS Vue page:
       - LotSelector panel after adding lot-tracked product
       - SerialScanner panel after adding serial-tracked product
       - All standard POS features (search, discount, payments, receipt)
     Quotations Vue page
     Done: Complete POS flow with lot and serial handling end-to-end.


## Phase 6 — PURCHASES  (Weeks 16–17)


6.1  [CRITICAL] Group G migrations:
       purchases, purchase_items, purchase_receives,
       purchase_receive_items, purchase_receive_lots,
       purchase_receive_serials, purchase_returns, purchase_return_items
     Done: All tables.

6.2  [CRITICAL] PurchaseService:
       create, send,
       receive(purchase, receiveData) — handles lot/serial data in receiveData
         → calls StockMovementService.createMovement for each lot/serial
         → creates purchase_receive_lots or purchase_receive_serials rows
       cancel, processReturn (decreases stock + reversal journal)
     Done: Lot receive creates stock_lots. Serial receive creates stock_serials.

6.3  PurchaseController + Purchases Vue page:
       Receive modal: for lot products → lot entry form (number, expiry, qty)
                      for serial products → serial scan/entry form
     Done: Receive flow for all 3 stock modes works in browser.


## Phase 7 — PAYMENTS & EXPENSES  (Weeks 18–19)


7.1  Group I migrations: purchase_payments, expense_categories,
     expenses, installment_plans, installment_schedules
     SalePaymentService, PurchasePaymentService, InstallmentService
     Payment modals (reusable on Sales and Purchases pages)
     ExpenseService: auto-posts journal on create
     ExpenseController + Expenses Vue page
     Done: Payments reduce balance. Journals post. Installments generate schedules.


## Phase 8 — LOYALTY POINTS  (Week 20)


8.1  loyalty_settings + loyalty_transactions migrations
     LoyaltyService: earnPoints, redeemPoints, expirePoints, adjustPoints
     LoyaltyController + loyalty settings Vue page
     POS: show points balance, redemption panel in payment section
     Daily scheduler: expire points by expiry_months setting
     Done: Earn on sale, redeem on POS, expire via scheduler.


## Phase 9 — REPORTS & DASHBOARD  (Weeks 21–22)


9.1  Dashboard API: all KPIs (add: expiring lots count)
     Dashboard Vue: KPI cards + Chart.js + recent transactions
     Done: Dashboard < 200ms on Redis hit.

9.2  All 25 report APIs + Vue pages with filters and export
     New reports: Lot Report, Lot Expiry Report, Serial Number Report
     Done: All reports render. Excel export works for every report.


## Phase 10 — NOTIFICATIONS & JOBS  (Week 23)


10.1 Low stock email job (qty-mode products)
10.2 Lot expiry alert job (daily: lots expiring in N days)
10.3 Lot expired job (daily: set lot.status=expired, create in-app notification)
10.4 Sale payment due reminder (daily)
10.5 Purchase payment due reminder (daily)
10.6 Installment overdue alert (daily)
10.7 Quotation expiry job (daily)
10.8 Recurring expense auto-create (daily)
10.9 In-app notification bell API + Vue bell component in SmartAdmin topbar
     Done: All 8 jobs fire. Bell shows unread count.


## Phase 11 — HRM MODULE  (Weeks 24–25)


11.1  All 9 HRM migrations
11.2  All HRM models (leave_balances with GENERATED remaining_days)
11.3  EmployeeService + DepartmentService + DesignationService
11.4  AttendanceService: checkIn, checkOut, computeHours, monthlyReport
11.5  LeaveService: submit, approve, reject, updateBalance
11.6  PayrollService: calculateRun, finalizeRun
11.7  All 24 HRM API controllers
11.8  Employee + Department + Designation Vue pages
11.9  Attendance calendar Vue page (monthly, color-coded per status)
11.10 Leave request Vue page (submit, manage, approval)
11.11 Payroll run Vue page + payslip PDF per employee
     Done: Full HRM workflow. Net pay verified.


## Phase 12 — TESTING, SECURITY & PRODUCTION  (Week 26)


12.1 Unit tests for all Service classes — 80%+ coverage target
     Critical tests:
       StockMovementServiceTest:
         - test_none_mode_deducts_correctly
         - test_lot_mode_creates_lot_row_and_movement
         - test_lot_mode_fifo_selects_oldest_lot
         - test_lot_mode_fefo_selects_nearest_expiry
         - test_lot_mode_spans_multiple_lots_when_needed
         - test_lot_mode_throws_when_lot_expired
         - test_lot_mode_throws_when_lot_recalled
         - test_serial_mode_creates_serial_row_on_receive
         - test_serial_mode_reserves_serial_on_confirm
         - test_serial_mode_throws_on_duplicate_serial
         - test_serial_mode_throws_if_serial_not_in_stock
         - test_concurrent_confirm_does_not_oversell
       AccountingServiceTest:
         - test_journal_must_balance
         - test_reversal_posts_opposite_entries
     Done: All tests pass. php artisan test clean.

12.2 Feature tests for all API endpoints:
     - Unauthenticated → 401
     - Wrong tenant → 404
     - Valid input → correct DB state
     - Invalid input → 422 with field errors
     - State machine transitions
     - Lot: movement created + lot qty updated
     - Serial: serial status transitions correctly
     Done: All critical paths covered.

12.3 Security: OWASP checks + rate limiting (5/min auth, 300/min API)

12.4 Performance: EXPLAIN all report queries. No query > 100ms on 100k rows.
     Redis cache strategy implemented for dashboard + search.

12.5 Swagger docs for all endpoints. /api/documentation complete.

12.6 Server: Nginx + Octane + Supervisor + Let's Encrypt SSL
     GitHub Actions CI/CD: test on push, deploy on merge
     MariaDB backup: daily mariadb-backup to S3 (hot backup, no table lock)
     Sentry: error monitoring + Slack alerts

12.7 First client pilot: supervised deployment + onboarding
     Done: Client actively using system. Feedback documented.


## SECTION 9 — CRITICAL RULES


  #   Rule                                            Why — What Breaks
  --  ----------------------------------------------  --------------------------------
  1   Never update stock directly.                    Audit ledger destroyed.
      Always use StockMovementService.                Stock history unrecoverable.

  2   Never update or delete journal_entries.         Trial balance breaks.
      Post a reversal journal to correct.             Accounts never reconcile.

  3   Never query the database in Web Controllers.    No API endpoint exists.
      Return view() only.                             Vue gets no data.

  4   Never put business logic in Controllers.        Code is untestable.
      Logic belongs only in Services.                 Rules become invisible.

  5   Always use DB::transaction() for               Partial save = corrupted DB.
      multi-table writes.                             Race conditions cause data loss.

  6   Always validate in Form Request                 Bad data deep in services
      before the Service sees it.                     causes hard-to-debug failures.

  7   Always use API Resources.                       Passwords, internal IDs,
      Never return raw Eloquent models.               sensitive fields leak.

  8   Never commit .env to Git.                       All credentials become public.

  9   Build Accounting BEFORE Sales.                  Impossible to retrofit
                                                      double-entry retroactively.

  10  Write tests while building each feature.        Late tests always miss
                                                      edge cases.

  11  All models must extend BaseModel.               Without BelongsToTenant,
      BelongsToTenant must be active.                 Business A sees Business B data.

  12  HRM uses app/ base classes.                     Duplicated base classes
      Never duplicate in Modules/.                    diverge and break silently.

  13  Reserve stock on CONFIRM.                       Two cashiers can oversell
      Deduct stock on COMPLETE only.                  the last unit simultaneously.

  14  Always include business_id in Redis keys.       Business A reads Business B's
                                                      cached data. Security breach.

  15  Use FULLTEXT for product/customer search.       LIKE %term% is too slow
      Never use LIKE %term% on large tables.          on 10,000+ row tables.

  16  Use GENERATED COLUMNS for computed fields.      Risk of available_qty getting
      (available_qty, qty_available, remaining_days)  out of sync with source data.

  17  Never sell from an expired or recalled lot.     LotExpiredException and
      StockMovementService enforces this.             LotRecalledException block it.

  18  Serial quantity is always 1.                    Any other value breaks the
      One stock_serials row = one physical unit.      serial tracking invariant.

  19  Duplicate serial numbers within a business      DuplicateSerialException must
      must be blocked at DB level (UNIQUE).           be thrown before DB write too.

  20  stock_tracking cannot be changed if             Stock data becomes invalid and
      movements exist for the product.               unreconcilable retroactively.


## SECTION 10 — AI PROMPT LIBRARY


SYSTEM PROMPT (paste before every AI session):

You are an expert Laravel developer building a production retail ERP system.

=== ARCHITECTURE ===
Global layer (app/) for all business features. One optional module (Modules/HRM/).

Global features: Auth, Users, Business/Tenant, Branches, Warehouses, Settings,
Tax Rates, Tax Groups, Customers, Customer Groups, Suppliers, Catalog (Products,
Variations, Brands, Categories, Units, Sub-Units, Variation Templates, Combo Items,
Price Groups), Inventory (Stock Movements, Stock Levels, Stock Lots, Stock Serials,
Stock Count, Barcode Labels), Sales + POS (Drafts, Quotations, Suspended, Returns,
Cash Register), Purchases (PO, Receive with Lots/Serials, Return), Accounting (COA,
Journals, Double-Entry, Payment Accounts), Sale Payments, Purchase Payments,
Installment Plans, Expenses, Loyalty Points, Notifications, Reports + Dashboard.

HRM Module (Modules/HRM/): Employees, Departments, Designations, Attendance, Leave, Payroll.

=== TECH STACK ===
Laravel 11, MariaDB 10.11 LTS, Redis 7, Laravel Sanctum (SPA cookie),
Spatie Permission, Spatie Media Library, DomPDF, Laravel Excel,
Vue 3 + Pinia + Axios + VeeValidate 4, Chart.js, SmartAdmin 4.5.1, Vite,
nwidart/laravel-modules (HRM only).

=== STRICT RULES ===
1.  All models extend App\Models\BaseModel (UUID, BelongsToTenant, SoftDeletes)
2.  All API controllers extend App\Http\Controllers\Api\V1\BaseApiController
3.  All repositories extend App\Repositories\BaseRepository
4.  BelongsToTenant auto-scopes every query by business_id
5.  Web controllers return ONLY view() — zero DB queries
6.  All data fetched via REST API — never passed through Blade
7.  Business logic ONLY in Service classes — never in Controllers
8.  All multi-table writes use DB::transaction()
9.  Stock changes ONLY through StockMovementService — never direct
10. Journal entries are append-only — reverse to correct, never delete or update
11. All API responses: { success, message, data } or { success, data, meta }
12. NEVER return raw Eloquent models — always use API Resources
13. Redis cache keys always include business_id for tenant isolation
14. Use FULLTEXT search in MariaDB for product and customer search
15. Use GENERATED COLUMNS for computed fields (available_qty, etc.)
16. stock_tracking modes: none (qty only) | lot (batch) | serial (individual)
17. Lot quantity is always 1+ per lot. Serial quantity is always exactly 1.
18. Throw typed domain exceptions — never return error strings from Services

PHP 8.2+. Typed properties. Return types on all public methods.
Explicit indexes on every FK in migrations. Form Request for validation.
API Resource for all responses. Eager loading to prevent N+1.

=== MARIADB NOTES ===
UUIDs: CHAR(36). JSON: native. GENERATED: ->storedAs('expr').
FULLTEXT: $table->fullText(['col']). Query: whereFullText(['col'], $term).
.env: DB_CONNECTION=mysql (same driver). Strict mode in AppServiceProvider::boot().

PROMPT A — Build a Migration
Write a Laravel 11 migration for table: {table_name}. Database: MariaDB 10.11.

Fields: {field | type | nullable/required | notes}

Always include:
- $table->uuid('id')->primary()
- $table->foreignUuid('business_id')->constrained()->cascadeOnDelete()  [INDEX]
- $table->timestamps() and softDeletes() (unless append-only)
- $table->uuid('created_by')->nullable()->index()
- $table->index(['business_id', 'created_at'])
- Explicit ->index() on every FK column
- DB::statement("ALTER TABLE {t} COMMENT = '...'") at end of up()

For GENERATED COLUMNS: $table->decimal('col', 15, 4)->storedAs('expr')
For FULLTEXT: $table->fullText(['col1', 'col2'])
For APPEND-ONLY: omit updated_at, note append-only in table comment
For lot-linked tables: include lot_id CHAR(36) nullable with index
For serial-linked tables: include serial_id CHAR(36) nullable with index

PROMPT B — Build a Model
Build Eloquent model: {ModelName}. Extends App\Models\BaseModel.

Relationships: {list all}
Include:
- $casts for decimal, boolean, json, datetime, enum fields
- $appends for computed attributes
- Scopes: active(), search($term with FULLTEXT), domain scopes
- State helpers: isPaid(), canConfirm(), isOverdue()
- StockLot extras: isExpired(), isDepleted(), isAvailable()
- StockSerial extras: isInStock(), isSold(), isReserved()
- PHP 8.2 return types on all public methods

PROMPT C — Build a Service
Build {Name}Service. Path: app/Services/{Group}/

Methods: {methodName(typed params): ReturnType — what it does}

Rules:
- Constructor-inject repositories and sub-services
- Every write touching 2+ tables uses DB::transaction()
- Throw typed domain exceptions for rule violations
- Dispatch Events after successful state changes
- Use Repository for ALL DB access — no direct Eloquent
- Stock: call StockMovementService only
- Journals: call AccountingService only
- Redis: use tenant-scoped key (always include business_id)

PROMPT D — Build an API Controller
Build {Name}Controller. Path: app/Http/Controllers/Api/V1/{Group}/

Endpoints: {list}
Rules:
- Extend BaseApiController
- Inject Service in constructor
- Use Form Request for store() and update()
- Use API Resource on ALL responses
- Catch domain exceptions → $this->error($e->getMessage(), 400)
- @OA Swagger annotations on every method
- ZERO business logic

PROMPT E — Build Form Requests
Build Store{Name}Request and Update{Name}Request.
Path: app/Http/Requests/{Group}/

Fields: {field | type | required/optional | rules}
Rules:
- authorize(): Spatie permission check
- Store: required fields mandatory. Update: all optional (PATCH).
- unique() scoped with business_id
- Rule::in([]) for enums
- Rule::exists() with business_id scope for FKs
- For lot-related requests: validate lot_id exists + belongs to business + is active
- For serial-related requests: validate serial exists + is in_stock + belongs to warehouse

PROMPT F — Build an API Resource
Build {Name}Resource. Path: app/Http/Resources/{Group}/

Include: {fields}
Exclude: password, remember_token, internal IDs not needed by frontend

Rules:
- whenLoaded() for all relationships
- Decimals as (float) with 2dp
- Dates as ISO 8601
- Computed: balance, is_overdue, full_name, display_status
- For StockLot: include qty_available (GENERATED), days_until_expiry, status_label
- For StockSerial: include status_label, current_location, history_count

PROMPT G — Build Vue Frontend
Build Vue 3 frontend for {FeatureName}/{PageName}.

Files:
- resources/js/api/{name}.js
- resources/js/stores/{name}.js
- resources/js/pages/{name}/index.js
- resources/js/pages/{name}/{Name}Page.vue

Features: {describe exactly}
Rules:
- SmartAdmin 4.5.1 Bootstrap 4.5 classes
- Shared components via @comps/
- <script setup> with Vue 3 Composition API
- Data only through Pinia store
- For sale/POS pages: use LotSelector.vue for lot products
- For sale/POS pages: use SerialScanner.vue for serial products
- VeeValidate 4 for all forms

PROMPT H — Write Tests
Write PHPUnit tests for {ServiceName} and its API.

Unit: tests/Unit/{Group}/{Service}Test.php
Feature: tests/Feature/{Group}/{Resource}ApiTest.php

Feature tests must cover:
- Unauthenticated → 401
- Wrong tenant → 404
- Valid → correct DB state
- Invalid → 422 with field errors
- State machine transitions
- Lot tests: lot row created, qty updated, FIFO/FEFO selection verified
- Serial tests: serial row created, status transitions, duplicate blocked
- Accounting: sum(debit) == sum(credit)
- Concurrent confirm: one request fails if last unit taken

PROMPT I — Debug
Debug this issue.
File: {path} | Error: {stack trace} | Expected: {} | Actual: {} | Code: {} | Tried: {}
Please: 1) root cause, 2) fix, 3) prevention.

PROMPT J — Extend Existing Feature
Add to: {Feature}. Capability: {desc}. Current state: {desc}.
Add: DB / Model / Service / API / Frontend.
Do not break existing. One block per file with full path. down() rollback-safe.


## SECTION 11 — FEATURE BUILD CHECKLIST


  Step  File                                              Done?  Purpose
  ----  ------------------------------------------------  -----  -----------------------
  1     database/migrations/{timestamp}_{table}.php       [ ]    Schema + indexes
  2     app/Models/{Name}.php                             [ ]    extends BaseModel
  3     app/Http/Requests/Store{Name}Request.php          [ ]    Input validation
  4     app/Http/Requests/Update{Name}Request.php         [ ]    Update validation
  5     app/Http/Resources/{Name}Resource.php             [ ]    API output shape
  6     app/Repositories/{Name}Repository.php             [ ]    DB access layer
  7     app/Services/{Name}Service.php                    [ ]    Business logic
  8     app/Http/Controllers/Api/V1/{Name}Controller.php  [ ]    REST endpoints
  9     app/Http/Controllers/Web/{Name}Controller.php     [ ]    view() only
  10    resources/views/{name}/index.blade.php            [ ]    SmartAdmin shell
  11    resources/js/api/{name}.js                        [ ]    Axios service
  12    resources/js/stores/{name}.js                     [ ]    Pinia store
  13    resources/js/pages/{name}/index.js                [ ]    Vue mount
  14    resources/js/pages/{name}/{Name}Page.vue          [ ]    Vue component
  15    tests/Unit/{Name}ServiceTest.php                  [ ]    Service unit tests
  16    tests/Feature/{Name}ApiTest.php                   [ ]    API feature tests


#### GOLDEN ORDER:

  Schema → Model → Requests → Resource → Repository → Service
  → Controller → Web Controller → Vue → Tests

Never build the Vue page before the API exists.
Never skip tests — they protect everything that comes after.


## End Of Plan

Version:       4.0
Changelog:     Lot/Serial tracking added. Restaurant features excluded.
               MariaDB 10.11 LTS. SmartAdmin 4.5.1.

Tables:        67 total (58 global + 9 HRM)
  New in v4:   stock_lots, stock_serials, sale_item_lots, sale_item_serials,
               purchase_receive_lots, purchase_receive_serials,
               stock_count_serials  (7 new tables)

Features:      19 global feature groups + HRM module

Stock modes:   none (quantity only) | lot (batch groups) | serial (individual units)
               Enabled per-product. Mode controlled by business settings.
               Switching mode blocked once stock movements exist.

Architecture:  app/ for all business features | Modules/HRM/ for optional HR
Database:      MariaDB 10.11 LTS — GENERATED COLUMNS, FULLTEXT, native JSON
UI:            SmartAdmin v4.5.1 (Bootstrap 4.5) + Vue 3 SPA in Blade shells
Build time:    26 weeks, 12 phases

Every feature Ultimate POS has (minus restaurant).
Lot and serial tracking built properly, not bolted on.
Built clean, built fast, built to sell.


## SECTION 12 — PROJECT SCAFFOLD TREE


  This is the complete file and folder structure of the project.
  Every path listed here corresponds to a real file you will create during
  the 26-week build. Use this as a map — tick off files as you finish them.

  Legend:
    [M]  Migration file
    [Mo] Model
    [Rq] Form Request (Store / Update)
    [Rs] API Resource
    [Rp] Repository
    [S]  Service class
    [C]  API Controller
    [W]  Web Controller (view() only)
    [V]  Blade view (SmartAdmin shell)
    [J]  Vue page entry point (index.js)
    [P]  Vue page component (.vue)
    [A]  Axios API service (api/*.js)
    [St] Pinia store
    [T]  PHPUnit test

ROOT

  erp/
  ├── .env                              (never commit to Git)
  ├── .env.example
  ├── composer.json
  ├── package.json
  ├── vite.config.js                    (auto-discovers page entry points)
  ├── artisan
  ├── docker-compose.yml                (MariaDB, Redis, phpMyAdmin, MailHog)
  └── Dockerfile

app/

  app/
  │
  ├── Exceptions/
  │   ├── Handler.php                   (global JSON error handler)
  │   └── Domain/
  │       ├── DomainException.php       (base class for all domain exceptions)
  │       ├── InsufficientStockException.php
  │       ├── InsufficientLotQtyException.php
  │       ├── SerialNotFoundException.php
  │       ├── SerialAlreadySoldException.php
  │       ├── DuplicateSerialException.php
  │       ├── InvalidStateTransitionException.php
  │       ├── UnbalancedJournalException.php
  │       ├── LotExpiredException.php
  │       └── LotRecalledException.php
  │
  ├── Http/
  │   ├── Kernel.php
  │   ├── Middleware/
  │   │   └── TenantResolver.php        (sets app('tenant') on every request)
  │   │
  │   ├── Controllers/
  │   │   ├── Api/V1/
  │   │   │   ├── BaseApiController.php [C]
  │   │   │   │
  │   │   │   ├── Auth/
  │   │   │   │   └── AuthController.php         [C] login, logout, me, password
  │   │   │   │
  │   │   │   ├── Foundation/
  │   │   │   │   ├── UserController.php         [C]
  │   │   │   │   ├── BusinessController.php     [C]
  │   │   │   │   ├── BranchController.php       [C]
  │   │   │   │   ├── WarehouseController.php    [C]
  │   │   │   │   └── SettingsController.php     [C]
  │   │   │   │
  │   │   │   ├── Tax/
  │   │   │   │   ├── TaxRateController.php      [C]
  │   │   │   │   └── TaxGroupController.php     [C]
  │   │   │   │
  │   │   │   ├── Contacts/
  │   │   │   │   ├── CustomerController.php     [C]
  │   │   │   │   ├── CustomerGroupController.php[C]
  │   │   │   │   └── SupplierController.php     [C]
  │   │   │   │
  │   │   │   ├── Catalog/
  │   │   │   │   ├── ProductController.php      [C]
  │   │   │   │   ├── CategoryController.php     [C]
  │   │   │   │   ├── BrandController.php        [C]
  │   │   │   │   ├── UnitController.php         [C]
  │   │   │   │   ├── SubUnitController.php      [C]
  │   │   │   │   ├── VariationTemplateController.php [C]
  │   │   │   │   └── PriceGroupController.php   [C]
  │   │   │   │
  │   │   │   ├── Inventory/
  │   │   │   │   ├── StockController.php        [C] levels, low stock
  │   │   │   │   ├── MovementController.php     [C] history, adjustments, transfers
  │   │   │   │   ├── LotController.php          [C] lots, expiring, status update
  │   │   │   │   ├── SerialController.php       [C] serials, history, write-off
  │   │   │   │   ├── StockCountController.php   [C] counts, complete
  │   │   │   │   └── BarcodeController.php      [C] label PDF
  │   │   │   │
  │   │   │   ├── Sales/
  │   │   │   │   ├── SaleController.php         [C] sales, POS, confirm, complete
  │   │   │   │   ├── QuotationController.php    [C]
  │   │   │   │   ├── SaleReturnController.php   [C]
  │   │   │   │   └── CashRegisterController.php [C]
  │   │   │   │
  │   │   │   ├── Purchases/
  │   │   │   │   ├── PurchaseController.php     [C] PO, receive (lots+serials)
  │   │   │   │   └── PurchaseReturnController.php [C]
  │   │   │   │
  │   │   │   ├── Accounting/
  │   │   │   │   ├── ChartOfAccountsController.php [C]
  │   │   │   │   ├── JournalController.php      [C]
  │   │   │   │   ├── PaymentAccountController.php  [C]
  │   │   │   │   ├── FiscalYearController.php   [C]
  │   │   │   │   └── ReportController.php       [C] trial balance, P&L, balance sheet
  │   │   │   │
  │   │   │   ├── Payments/
  │   │   │   │   ├── SalePaymentController.php  [C]
  │   │   │   │   ├── PurchasePaymentController.php [C]
  │   │   │   │   └── InstallmentController.php  [C]
  │   │   │   │
  │   │   │   ├── Expenses/
  │   │   │   │   ├── ExpenseController.php      [C]
  │   │   │   │   └── ExpenseCategoryController.php [C]
  │   │   │   │
  │   │   │   ├── Loyalty/
  │   │   │   │   └── LoyaltyController.php      [C]
  │   │   │   │
  │   │   │   ├── Notifications/
  │   │   │   │   └── NotificationController.php [C]
  │   │   │   │
  │   │   │   └── Reports/
  │   │   │       └── ReportController.php       [C] all 25 reports + exports
  │   │   │
  │   │   └── Web/
  │   │       ├── DashboardController.php        [W]
  │   │       ├── Foundation/
  │   │       │   ├── UserController.php         [W]
  │   │       │   ├── BranchController.php       [W]
  │   │       │   └── WarehouseController.php    [W]
  │   │       ├── Catalog/
  │   │       │   └── ProductController.php      [W]
  │   │       ├── Inventory/
  │   │       │   ├── StockController.php        [W]
  │   │       │   ├── LotController.php          [W]
  │   │       │   ├── SerialController.php       [W]
  │   │       │   └── StockCountController.php   [W]
  │   │       ├── Sales/
  │   │       │   ├── SaleController.php         [W]
  │   │       │   ├── POSController.php          [W]
  │   │       │   └── QuotationController.php    [W]
  │   │       ├── Purchases/
  │   │       │   └── PurchaseController.php     [W]
  │   │       ├── Accounting/
  │   │       │   ├── JournalController.php      [W]
  │   │       │   └── ChartOfAccountsController.php [W]
  │   │       ├── Expenses/
  │   │       │   └── ExpenseController.php      [W]
  │   │       └── Reports/
  │   │           └── ReportController.php       [W]
  │   │
  │   └── Requests/
  │       ├── Foundation/
  │       │   ├── StoreUserRequest.php           [Rq]
  │       │   ├── UpdateUserRequest.php          [Rq]
  │       │   ├── StoreBranchRequest.php         [Rq]
  │       │   ├── UpdateBranchRequest.php        [Rq]
  │       │   ├── StoreWarehouseRequest.php      [Rq]
  │       │   └── UpdateWarehouseRequest.php     [Rq]
  │       ├── Tax/
  │       │   ├── StoreTaxRateRequest.php        [Rq]
  │       │   └── StoreTaxGroupRequest.php       [Rq]
  │       ├── Contacts/
  │       │   ├── StoreCustomerRequest.php       [Rq]
  │       │   ├── UpdateCustomerRequest.php      [Rq]
  │       │   ├── StoreSupplierRequest.php       [Rq]
  │       │   └── UpdateSupplierRequest.php      [Rq]
  │       ├── Catalog/
  │       │   ├── StoreProductRequest.php        [Rq]
  │       │   └── UpdateProductRequest.php       [Rq]
  │       ├── Inventory/
  │       │   ├── StoreAdjustmentRequest.php     [Rq]
  │       │   ├── StoreTransferRequest.php       [Rq]
  │       │   ├── StoreStockCountRequest.php     [Rq]
  │       │   └── UpdateLotStatusRequest.php     [Rq]
  │       ├── Sales/
  │       │   ├── StoreSaleRequest.php           [Rq]
  │       │   ├── UpdateSaleRequest.php          [Rq]
  │       │   └── StoreSaleReturnRequest.php     [Rq]
  │       ├── Purchases/
  │       │   ├── StorePurchaseRequest.php       [Rq]
  │       │   ├── ReceivePurchaseRequest.php     [Rq]  (lot + serial data)
  │       │   └── StorePurchaseReturnRequest.php [Rq]
  │       ├── Accounting/
  │       │   ├── StoreJournalRequest.php        [Rq]
  │       │   └── StorePaymentAccountRequest.php [Rq]
  │       ├── Payments/
  │       │   ├── StoreSalePaymentRequest.php    [Rq]
  │       │   └── StorePurchasePaymentRequest.php[Rq]
  │       └── Expenses/
  │           └── StoreExpenseRequest.php        [Rq]
  │
  ├── Models/
  │   ├── BaseModel.php                 [Mo] HasUuid, BelongsToTenant, SoftDeletes
  │   │
  │   ├── Foundation/
  │   │   ├── Business.php             [Mo]
  │   │   ├── Branch.php               [Mo]
  │   │   ├── Warehouse.php            [Mo]
  │   │   ├── User.php                 [Mo]
  │   │   ├── Setting.php              [Mo]
  │   │   └── AuditLog.php             [Mo]
  │   │
  │   ├── Tax/
  │   │   ├── TaxRate.php              [Mo]
  │   │   ├── TaxGroup.php             [Mo]
  │   │   └── TaxGroupItem.php         [Mo]
  │   │
  │   ├── Contacts/
  │   │   ├── Customer.php             [Mo] FULLTEXT scope
  │   │   ├── CustomerGroup.php        [Mo]
  │   │   └── Supplier.php             [Mo]
  │   │
  │   ├── Catalog/
  │   │   ├── Product.php              [Mo] stock_tracking field, FULLTEXT scope
  │   │   ├── ProductVariation.php     [Mo]
  │   │   ├── ProductCategory.php      [Mo]
  │   │   ├── Brand.php                [Mo]
  │   │   ├── Unit.php                 [Mo]
  │   │   ├── SubUnit.php              [Mo]
  │   │   ├── VariationTemplate.php    [Mo]
  │   │   ├── VariationValue.php       [Mo]
  │   │   ├── ComboItem.php            [Mo]
  │   │   ├── PriceGroup.php           [Mo]
  │   │   └── PriceGroupPrice.php      [Mo]
  │   │
  │   ├── Inventory/
  │   │   ├── StockMovement.php        [Mo] no updated_at, lot_id, serial_id
  │   │   ├── StockLevel.php           [Mo] GENERATED available_qty
  │   │   ├── StockLot.php             [Mo] GENERATED qty_available, state machine
  │   │   ├── StockSerial.php          [Mo] state machine methods
  │   │   ├── StockCount.php           [Mo]
  │   │   └── StockCountItem.php       [Mo] GENERATED difference
  │   │
  │   ├── Sales/
  │   │   ├── Sale.php                 [Mo] state machine
  │   │   ├── SaleItem.php             [Mo]
  │   │   ├── SaleItemLot.php          [Mo]
  │   │   ├── SaleItemSerial.php       [Mo]
  │   │   ├── SalePayment.php          [Mo]
  │   │   ├── SaleReturn.php           [Mo]
  │   │   ├── SaleReturnItem.php       [Mo]
  │   │   ├── CashRegister.php         [Mo]
  │   │   └── CashRegisterSession.php  [Mo]
  │   │
  │   ├── Purchases/
  │   │   ├── Purchase.php             [Mo] state machine
  │   │   ├── PurchaseItem.php         [Mo]
  │   │   ├── PurchaseReceive.php      [Mo]
  │   │   ├── PurchaseReceiveItem.php  [Mo]
  │   │   ├── PurchaseReceiveLot.php   [Mo]
  │   │   ├── PurchaseReceiveSerial.php[Mo]
  │   │   ├── PurchaseReturn.php       [Mo]
  │   │   └── PurchaseReturnItem.php   [Mo]
  │   │
  │   ├── Accounting/
  │   │   ├── PaymentAccount.php       [Mo]
  │   │   ├── AccountTransaction.php   [Mo] no updated_at, append-only
  │   │   ├── ChartOfAccounts.php      [Mo]
  │   │   ├── FiscalYear.php           [Mo]
  │   │   ├── Journal.php              [Mo]
  │   │   └── JournalEntry.php         [Mo] no updated_at, append-only
  │   │
  │   ├── Payments/
  │   │   ├── PurchasePayment.php      [Mo]
  │   │   ├── InstallmentPlan.php      [Mo]
  │   │   └── InstallmentSchedule.php  [Mo]
  │   │
  │   ├── Expenses/
  │   │   ├── Expense.php              [Mo]
  │   │   └── ExpenseCategory.php      [Mo]
  │   │
  │   └── Loyalty/
  │       ├── LoyaltySetting.php       [Mo]
  │       └── LoyaltyTransaction.php   [Mo] no updated_at, append-only
  │
  ├── Http/Resources/
  │   ├── Foundation/
  │   │   ├── UserResource.php         [Rs]
  │   │   ├── BranchResource.php       [Rs]
  │   │   └── WarehouseResource.php    [Rs]
  │   ├── Contacts/
  │   │   ├── CustomerResource.php     [Rs]
  │   │   └── SupplierResource.php     [Rs]
  │   ├── Catalog/
  │   │   └── ProductResource.php      [Rs]
  │   ├── Inventory/
  │   │   ├── StockLevelResource.php   [Rs]
  │   │   ├── StockMovementResource.php[Rs]
  │   │   ├── StockLotResource.php     [Rs] days_until_expiry, status_label
  │   │   └── StockSerialResource.php  [Rs] status_label, history_count
  │   ├── Sales/
  │   │   ├── SaleResource.php         [Rs]
  │   │   └── SaleItemResource.php     [Rs]
  │   ├── Purchases/
  │   │   └── PurchaseResource.php     [Rs]
  │   └── Accounting/
  │       ├── JournalResource.php      [Rs]
  │       └── ChartOfAccountsResource.php [Rs]
  │
  ├── Repositories/
  │   ├── BaseRepository.php           [Rp] Redis cache, CRUD, tenant-scoped
  │   ├── Foundation/
  │   │   ├── UserRepository.php       [Rp]
  │   │   ├── BranchRepository.php     [Rp]
  │   │   └── SettingsRepository.php   [Rp]
  │   ├── Contacts/
  │   │   ├── CustomerRepository.php   [Rp]
  │   │   └── SupplierRepository.php   [Rp]
  │   ├── Catalog/
  │   │   └── ProductRepository.php    [Rp]
  │   ├── Inventory/
  │   │   ├── StockMovementRepository.php [Rp]
  │   │   ├── StockLevelRepository.php    [Rp]
  │   │   ├── StockLotRepository.php      [Rp]
  │   │   └── StockSerialRepository.php   [Rp]
  │   ├── Sales/
  │   │   └── SaleRepository.php       [Rp]
  │   ├── Purchases/
  │   │   └── PurchaseRepository.php   [Rp]
  │   └── Accounting/
  │       ├── JournalRepository.php    [Rp]
  │       └── PaymentAccountRepository.php [Rp]
  │
  ├── Services/
  │   ├── Foundation/
  │   │   ├── UserService.php          [S]
  │   │   ├── BranchService.php        [S]
  │   │   ├── WarehouseService.php     [S]
  │   │   └── SettingsService.php      [S] Redis cache load/bust
  │   ├── Tax/
  │   │   └── TaxService.php           [S]
  │   ├── Contacts/
  │   │   ├── CustomerService.php      [S]
  │   │   └── SupplierService.php      [S]
  │   ├── Catalog/
  │   │   └── ProductService.php       [S] lock stock_tracking if movements exist
  │   ├── Inventory/
  │   │   ├── StockMovementService.php [S] ← THE most critical service
  │   │   │                                   createMovement, reserveStock,
  │   │   │                                   deductStock, selectLots,
  │   │   │                                   transferStock, returnToStock
  │   │   └── StockCountService.php    [S]
  │   ├── Sales/
  │   │   ├── SaleService.php          [S] calls StockMovementService
  │   │   ├── QuotationService.php     [S]
  │   │   └── CashRegisterService.php  [S]
  │   ├── Purchases/
  │   │   └── PurchaseService.php      [S] calls StockMovementService on receive
  │   ├── Accounting/
  │   │   └── AccountingService.php    [S] postJournal, reverseJournal,
  │   │                                    postSaleJournal, postPurchaseJournal
  │   ├── Payments/
  │   │   ├── SalePaymentService.php   [S]
  │   │   ├── PurchasePaymentService.php [S]
  │   │   └── InstallmentService.php   [S]
  │   ├── Expenses/
  │   │   └── ExpenseService.php       [S]
  │   ├── Loyalty/
  │   │   └── LoyaltyService.php       [S]
  │   └── Reports/
  │       └── ReportService.php        [S] all 25 reports, Excel export
  │
  └── Traits/
      ├── HasUuid.php                  (auto UUID on creating)
      ├── BelongsToTenant.php          (global scope by business_id)
      └── HasUserTracking.php          (auto created_by / updated_by)

database/

  database/
  ├── migrations/
  │   │
  │   │   ── GROUP A — FOUNDATION ──
  │   ├── 0001_create_businesses_table.php              [M]
  │   ├── 0002_create_branches_table.php                [M]
  │   ├── 0003_create_warehouses_table.php              [M]
  │   ├── 0004_create_users_table.php                   [M]
  │   ├── 0005_create_spatie_permission_tables.php      [M]
  │   ├── 0006_create_settings_table.php                [M]
  │   ├── 0007_create_audit_logs_table.php              [M]
  │   │
  │   │   ── GROUP B — TAX ──
  │   ├── 0008_create_tax_rates_table.php               [M]
  │   ├── 0009_create_tax_groups_table.php              [M]
  │   ├── 0010_create_tax_group_items_table.php         [M]
  │   │
  │   │   ── GROUP C — CONTACTS ──
  │   ├── 0011_create_customer_groups_table.php         [M]
  │   ├── 0012_create_customers_table.php               [M] FULLTEXT
  │   ├── 0013_create_suppliers_table.php               [M]
  │   │
  │   │   ── GROUP D — CATALOG ──
  │   ├── 0014_create_product_categories_table.php      [M]
  │   ├── 0015_create_brands_table.php                  [M]
  │   ├── 0016_create_units_table.php                   [M]
  │   ├── 0017_create_sub_units_table.php               [M]
  │   ├── 0018_create_variation_templates_table.php     [M]
  │   ├── 0019_create_variation_values_table.php        [M]
  │   ├── 0020_create_products_table.php                [M] FULLTEXT, stock_tracking
  │   ├── 0021_create_product_variations_table.php      [M]
  │   ├── 0022_create_combo_items_table.php             [M]
  │   ├── 0023_create_price_groups_table.php            [M]
  │   ├── 0024_create_price_group_prices_table.php      [M]
  │   │
  │   │   ── GROUP E — INVENTORY ──
  │   ├── 0025_create_stock_movements_table.php         [M] lot_id, serial_id
  │   ├── 0026_create_stock_levels_table.php            [M] GENERATED available_qty
  │   ├── 0027_create_stock_lots_table.php              [M] GENERATED qty_available
  │   ├── 0028_create_stock_serials_table.php           [M] UNIQUE serial per business
  │   ├── 0029_create_stock_counts_table.php            [M]
  │   ├── 0030_create_stock_count_items_table.php       [M] GENERATED difference
  │   ├── 0031_create_stock_count_serials_table.php     [M]
  │   │
  │   │   ── GROUP F — SALES ──
  │   ├── 0032_create_sales_table.php                   [M]
  │   ├── 0033_create_sale_items_table.php              [M]
  │   ├── 0034_create_sale_item_lots_table.php          [M]
  │   ├── 0035_create_sale_item_serials_table.php       [M]
  │   ├── 0036_create_sale_payments_table.php           [M]
  │   ├── 0037_create_sale_returns_table.php            [M]
  │   ├── 0038_create_sale_return_items_table.php       [M]
  │   ├── 0039_create_cash_registers_table.php          [M]
  │   ├── 0040_create_cash_register_sessions_table.php  [M]
  │   │
  │   │   ── GROUP G — PURCHASES ──
  │   ├── 0041_create_purchases_table.php               [M]
  │   ├── 0042_create_purchase_items_table.php          [M]
  │   ├── 0043_create_purchase_receives_table.php       [M]
  │   ├── 0044_create_purchase_receive_items_table.php  [M]
  │   ├── 0045_create_purchase_receive_lots_table.php   [M]
  │   ├── 0046_create_purchase_receive_serials_table.php[M]
  │   ├── 0047_create_purchase_returns_table.php        [M]
  │   ├── 0048_create_purchase_return_items_table.php   [M]
  │   │
  │   │   ── GROUP H — ACCOUNTING ──
  │   ├── 0049_create_payment_accounts_table.php        [M]
  │   ├── 0050_create_account_transactions_table.php    [M] append-only
  │   ├── 0051_create_chart_of_accounts_table.php       [M]
  │   ├── 0052_create_fiscal_years_table.php            [M]
  │   ├── 0053_create_journals_table.php                [M]
  │   ├── 0054_create_journal_entries_table.php         [M] append-only
  │   │
  │   │   ── GROUP I — PAYMENTS & EXPENSES ──
  │   ├── 0055_create_purchase_payments_table.php       [M]
  │   ├── 0056_create_expense_categories_table.php      [M]
  │   ├── 0057_create_expenses_table.php                [M]
  │   ├── 0058_create_installment_plans_table.php       [M]
  │   ├── 0059_create_installment_schedules_table.php   [M]
  │   │
  │   │   ── GROUP J — LOYALTY ──
  │   ├── 0060_create_loyalty_settings_table.php        [M]
  │   ├── 0061_create_loyalty_transactions_table.php    [M] append-only
  │   │
  │   │   ── GROUP K — NOTIFICATIONS ──
  │   └── 0062_create_notifications_table.php           [M] Laravel standard
  │
  └── seeders/
      ├── DatabaseSeeder.php
      ├── RolePermissionSeeder.php      (6 roles + all permissions)
      ├── DefaultSettingsSeeder.php     (all groups including stock group)
      └── ChartOfAccountsSeeder.php     (21 default COA accounts)

resources/

  resources/
  ├── views/
  │   ├── layouts/
  │   │   └── app.blade.php             SmartAdmin master layout
  │   ├── auth/
  │   │   └── login.blade.php           [V]
  │   ├── dashboard/
  │   │   └── index.blade.php           [V]
  │   ├── users/
  │   │   └── index.blade.php           [V]
  │   ├── branches/
  │   │   └── index.blade.php           [V]
  │   ├── warehouses/
  │   │   └── index.blade.php           [V]
  │   ├── settings/
  │   │   └── index.blade.php           [V]
  │   ├── tax/
  │   │   └── index.blade.php           [V]
  │   ├── customers/
  │   │   └── index.blade.php           [V]
  │   ├── suppliers/
  │   │   └── index.blade.php           [V]
  │   ├── products/
  │   │   └── index.blade.php           [V]
  │   ├── inventory/
  │   │   ├── stock/index.blade.php     [V]
  │   │   ├── lots/index.blade.php      [V]
  │   │   ├── serials/index.blade.php   [V]
  │   │   ├── adjustments/index.blade.php [V]
  │   │   ├── transfers/index.blade.php [V]
  │   │   └── counts/index.blade.php    [V]
  │   ├── sales/
  │   │   ├── index.blade.php           [V]
  │   │   └── pos.blade.php             [V]
  │   ├── quotations/
  │   │   └── index.blade.php           [V]
  │   ├── purchases/
  │   │   └── index.blade.php           [V]
  │   ├── accounting/
  │   │   ├── coa/index.blade.php       [V]
  │   │   └── journals/index.blade.php  [V]
  │   ├── expenses/
  │   │   └── index.blade.php           [V]
  │   ├── payments/
  │   │   └── accounts/index.blade.php  [V]
  │   └── reports/
  │       └── index.blade.php           [V]
  │
  └── js/
      ├── api/                          Axios service files [A]
      │   ├── auth.js
      │   ├── users.js
      │   ├── branches.js
      │   ├── warehouses.js
      │   ├── settings.js
      │   ├── customers.js
      │   ├── suppliers.js
      │   ├── products.js
      │   ├── inventory.js              (stock levels, adjustments, transfers)
      │   ├── lots.js
      │   ├── serials.js
      │   ├── stockCounts.js
      │   ├── sales.js
      │   ├── pos.js
      │   ├── quotations.js
      │   ├── purchases.js
      │   ├── accounting.js
      │   ├── expenses.js
      │   ├── payments.js
      │   ├── loyalty.js
      │   ├── notifications.js
      │   └── reports.js
      │
      ├── stores/                       Pinia stores [St]
      │   ├── auth.js
      │   ├── users.js
      │   ├── customers.js
      │   ├── suppliers.js
      │   ├── products.js
      │   ├── inventory.js
      │   ├── lots.js
      │   ├── serials.js
      │   ├── sales.js
      │   ├── pos.js
      │   ├── purchases.js
      │   ├── accounting.js
      │   ├── expenses.js
      │   ├── reports.js
      │   └── notifications.js
      │
      ├── components/
      │   └── ui/                       Shared Vue components
      │       ├── DataTable.vue
      │       ├── AppModal.vue
      │       ├── AppPagination.vue
      │       ├── SearchInput.vue
      │       ├── StatusBadge.vue
      │       ├── ConfirmDelete.vue
      │       ├── AppAlert.vue
      │       ├── LoadingSpinner.vue
      │       ├── LotSelector.vue       (lot panel for POS + invoice)
      │       ├── SerialScanner.vue     (serial scan panel for POS + invoice)
      │       ├── LotBadge.vue          (inline lot chip)
      │       └── SerialChip.vue        (inline serial chip)
      │
      └── pages/                        Vue pages (each has index.js + Page.vue)
          ├── dashboard/
          │   ├── index.js              [J]
          │   └── DashboardPage.vue     [P]
          ├── users/
          │   ├── index.js              [J]
          │   └── UsersPage.vue         [P]
          ├── branches/
          │   ├── index.js              [J]
          │   └── BranchesPage.vue      [P]
          ├── warehouses/
          │   ├── index.js              [J]
          │   └── WarehousesPage.vue    [P]
          ├── settings/
          │   ├── index.js              [J]
          │   └── SettingsPage.vue      [P]
          ├── customers/
          │   ├── index.js              [J]
          │   └── CustomersPage.vue     [P]
          ├── suppliers/
          │   ├── index.js              [J]
          │   └── SuppliersPage.vue     [P]
          ├── products/
          │   ├── index.js              [J]
          │   └── ProductsPage.vue      [P]
          ├── inventory-stock/
          │   ├── index.js              [J]
          │   └── StockPage.vue         [P]
          ├── inventory-lots/
          │   ├── index.js              [J]
          │   └── LotsPage.vue          [P]
          ├── inventory-serials/
          │   ├── index.js              [J]
          │   └── SerialsPage.vue       [P]
          ├── inventory-adjustments/
          │   ├── index.js              [J]
          │   └── AdjustmentsPage.vue   [P]
          ├── inventory-transfers/
          │   ├── index.js              [J]
          │   └── TransfersPage.vue     [P]
          ├── inventory-counts/
          │   ├── index.js              [J]
          │   └── StockCountPage.vue    [P]
          ├── sales/
          │   ├── index.js              [J]
          │   └── SalesPage.vue         [P]
          ├── pos/
          │   ├── index.js              [J]
          │   └── POSPage.vue           [P] (LotSelector + SerialScanner embedded)
          ├── quotations/
          │   ├── index.js              [J]
          │   └── QuotationsPage.vue    [P]
          ├── purchases/
          │   ├── index.js              [J]
          │   └── PurchasesPage.vue     [P] (lot + serial receive modal embedded)
          ├── accounting-coa/
          │   ├── index.js              [J]
          │   └── COAPage.vue           [P]
          ├── accounting-journals/
          │   ├── index.js              [J]
          │   └── JournalsPage.vue      [P]
          ├── expenses/
          │   ├── index.js              [J]
          │   └── ExpensesPage.vue      [P]
          ├── payment-accounts/
          │   ├── index.js              [J]
          │   └── PaymentAccountsPage.vue [P]
          └── reports/
              ├── index.js              [J]
              └── ReportsPage.vue       [P]

routes/

  routes/
  ├── web.php                           (all Web Controller routes)
  └── api.php                           (all API V1 routes)

tests/

  tests/
  ├── Unit/
  │   ├── Inventory/
  │   │   └── StockMovementServiceTest.php   [T] ← most critical tests
  │   ├── Accounting/
  │   │   └── AccountingServiceTest.php      [T]
  │   ├── Sales/
  │   │   └── SaleServiceTest.php            [T]
  │   └── Purchases/
  │       └── PurchaseServiceTest.php        [T]
  │
  └── Feature/
      ├── Auth/
      │   └── AuthApiTest.php               [T]
      ├── Foundation/
      │   ├── UserApiTest.php               [T]
      │   └── BranchApiTest.php             [T]
      ├── Catalog/
      │   └── ProductApiTest.php            [T]
      ├── Inventory/
      │   ├── StockApiTest.php              [T]
      │   ├── LotApiTest.php                [T] FIFO/FEFO, spanning, expired block
      │   └── SerialApiTest.php             [T] status transitions, duplicate block
      ├── Sales/
      │   └── SaleApiTest.php               [T] state machine, lot/serial on confirm
      └── Purchases/
          └── PurchaseApiTest.php           [T] receive with lots, receive with serials

Modules/HRM/

  Modules/HRM/
  ├── Database/Migrations/
  │   ├── H01_create_departments_table.php        [M]
  │   ├── H02_create_designations_table.php       [M]
  │   ├── H03_create_employees_table.php          [M]
  │   ├── H04_create_attendance_records_table.php [M]
  │   ├── H05_create_leave_types_table.php        [M]
  │   ├── H06_create_leave_balances_table.php     [M] GENERATED remaining_days
  │   ├── H07_create_leave_requests_table.php     [M]
  │   ├── H08_create_payroll_runs_table.php       [M]
  │   └── H09_create_payroll_items_table.php      [M]
  │
  ├── Models/
  │   ├── Department.php                          [Mo] extends BaseModel
  │   ├── Designation.php                         [Mo]
  │   ├── Employee.php                            [Mo]
  │   ├── AttendanceRecord.php                    [Mo]
  │   ├── LeaveType.php                           [Mo]
  │   ├── LeaveBalance.php                        [Mo] GENERATED remaining_days
  │   ├── LeaveRequest.php                        [Mo]
  │   ├── PayrollRun.php                          [Mo]
  │   └── PayrollItem.php                         [Mo]
  │
  ├── Http/Controllers/Api/V1/
  │   ├── EmployeeController.php                  [C]
  │   ├── DepartmentController.php                [C]
  │   ├── DesignationController.php               [C]
  │   ├── AttendanceController.php                [C]
  │   ├── LeaveTypeController.php                 [C]
  │   ├── LeaveRequestController.php              [C]
  │   ├── LeaveBalanceController.php              [C]
  │   └── PayrollController.php                   [C]
  │
  ├── Services/
  │   ├── EmployeeService.php                     [S]
  │   ├── AttendanceService.php                   [S]
  │   ├── LeaveService.php                        [S]
  │   └── PayrollService.php                      [S]
  │
  ├── Resources/js/pages/
  │   ├── hrm-employees/
  │   │   ├── index.js                            [J]
  │   │   └── EmployeesPage.vue                   [P]
  │   ├── hrm-attendance/
  │   │   ├── index.js                            [J]
  │   │   └── AttendancePage.vue                  [P]
  │   ├── hrm-leave/
  │   │   ├── index.js                            [J]
  │   │   └── LeavePage.vue                       [P]
  │   └── hrm-payroll/
  │       ├── index.js                            [J]
  │       └── PayrollPage.vue                     [P]
  │
  └── Routes/
      └── api.php

SCAFFOLD SUMMARY

  File type              Approx. count
  ---------------------  -------------
  Migrations [M]         67 total (58 global + 9 HRM)
  Models [Mo]            58 total (49 global + 9 HRM)
  Form Requests [Rq]     ~50
  API Resources [Rs]     ~30
  Repositories [Rp]      ~20
  Services [S]           ~25
  API Controllers [C]    ~30
  Web Controllers [W]    ~20
  Blade Views [V]        ~30
  Vue pages [J+P]        ~30 pairs
  Axios API files [A]    ~22
  Pinia stores [St]      ~15
  PHPUnit tests [T]      ~15 files, 80+ test methods
  ---------------------  -------------
  Total tracked files    ~440+

  Build order follows GOLDEN ORDER (Section 11):
    Schema → Model → Requests → Resource → Repository
    → Service → Controller → Web Controller → Vue → Tests

  Critical path (nothing else can be built until these are done):
    BaseModel + Traits → TenantResolver → Exception Handler
    → Group A migrations → Auth → StockMovementService
    → AccountingService → SaleService → PurchaseService


## SECTION 13 — PRACTICAL STEP-BY-STEP BUILD GUIDE FOR BEGINNERS


  This section is your hands-on daily guide. It tells you WHAT to do,
  WHY you are doing it, WHAT to type, and WHAT the result should look like.
  Follow it in order. Never skip ahead.

  Before anything else, understand these two ideas:

  IDEA 1 — You are building a product, not practising homework.
    Every file you write is a real piece of software that a real business
    will use to manage money and stock. Write it carefully.

  IDEA 2 — You have an AI assistant (this conversation).
    Every code block in this guide is a starting point. When you need a
    complete file, use the AI prompts from Section 10 and paste the result
    into your editor. Do not type code from memory. Copy, understand, adapt.


## Phase 0 — COMPUTER SETUP (do this once before writing a single line of code)


  WHAT THIS PHASE IS:
    Installing the tools that every developer uses.
    Without these tools the project cannot run at all.


#### STEP 0.1  Install Required Software


    Install these programs on your computer in this order.
    All are free. All have official download pages.

    Program             Where to download                  Why you need it
    ------------------  ---------------------------------  ----------------------
    Git                 git-scm.com                        Save and track changes
    PHP 8.2             php.net/downloads.php              Run Laravel
    Composer            getcomposer.org                    Install PHP packages
    Node.js (LTS)       nodejs.org                         Run Vue + Vite
    Docker Desktop      docker.com/products/docker-desktop MariaDB + Redis locally
    VS Code             code.visualstudio.com              Code editor

    After installing, open a terminal (Command Prompt on Windows,
    Terminal on Mac/Linux) and check each one works:

      php -v          → should say PHP 8.2.x or higher
      composer -V     → should say Composer version 2.x
      node -v         → should say v20.x or higher
      npm -v          → should say 10.x or higher
      git --version   → should say git version 2.x
      docker -v       → should say Docker version 26.x or higher

    If any command fails, re-install that program.


#### STEP 0.2  Install VS Code Extensions


    Open VS Code. Click the Extensions icon (left sidebar, looks like 4 squares).
    Search and install each of these:

      Extension name                  Why
      ------------------------------  ------------------------------------
      PHP Intelephense                Smart PHP autocomplete + error hints
      Laravel Extension Pack          Laravel-specific helpers
      Volar (Vue Language Features)   Vue 3 support
      ESLint                          JavaScript error detection
      Prettier                        Auto-formats your code
      GitLens                         See Git history inside VS Code
      Docker                          Manage containers from VS Code


#### STEP 0.3  Create a GitHub Account and First Repository


    WHY: Git saves your work history. GitHub is a safe place to store it.
    If your computer dies, your code is safe on GitHub.

    1. Go to github.com and create a free account.
    2. Create a new private repository called: erp-system
    3. Do NOT add a README yet (you will push from your computer).

    You will connect your project to GitHub in Step 1.3.


#### STEP 0.4  Start Docker Services


    WHY: Instead of installing MariaDB and Redis directly on your computer
    (which is complicated and messy), Docker runs them inside isolated
    containers. One command starts everything.

    Create a folder on your computer called: C:\projects\erp  (Windows)
    or ~/projects/erp  (Mac/Linux). This is where ALL your project files live.

    Inside that folder, create this file: docker-compose.yml

    ┌─────────────────────────────────────────────────────────────────────┐
    │  docker-compose.yml                                                  │
    ├─────────────────────────────────────────────────────────────────────┤
    │  version: '3.8'                                                      │
    │  services:                                                           │
    │    mariadb:                                                          │
    │      image: mariadb:10.11                                            │
    │      container_name: erp_mariadb                                     │
    │      restart: unless-stopped                                         │
    │      environment:                                                    │
    │        MYSQL_ROOT_PASSWORD: secret                                   │
    │        MYSQL_DATABASE: erp_db                                        │
    │        MYSQL_USER: erp_user                                          │
    │        MYSQL_PASSWORD: erp_pass                                      │
    │      ports:                                                          │
    │        - "3306:3306"                                                 │
    │      volumes:                                                        │
    │        - mariadb_data:/var/lib/mysql                                 │
    │                                                                      │
    │    redis:                                                            │
    │      image: redis:7-alpine                                           │
    │      container_name: erp_redis                                       │
    │      restart: unless-stopped                                         │
    │      ports:                                                          │
    │        - "6379:6379"                                                 │
    │                                                                      │
    │    phpmyadmin:                                                       │
    │      image: phpmyadmin:latest                                        │
    │      container_name: erp_phpmyadmin                                  │
    │      restart: unless-stopped                                         │
    │      environment:                                                    │
    │        PMA_HOST: mariadb                                             │
    │        PMA_USER: erp_user                                            │
    │        PMA_PASSWORD: erp_pass                                        │
    │      ports:                                                          │
    │        - "8080:80"                                                   │
    │      depends_on:                                                     │
    │        - mariadb                                                      │
    │                                                                      │
    │  volumes:                                                            │
    │    mariadb_data:                                                     │
    └─────────────────────────────────────────────────────────────────────┘

    In your terminal, go to that folder and run:
      docker compose up -d

    Wait 30 seconds. Then open a browser and go to: http://localhost:8080
    You should see the phpMyAdmin login screen. That means MariaDB is running.

    WHAT EACH SERVICE IS:
      mariadb     — your database (where all your data lives)
      redis       — fast memory cache (speeds up the app)
      phpmyadmin  — visual database manager (you use this to inspect tables)

    ✓ CHECKPOINT: phpMyAdmin loads at http://localhost:8080
    ✓ CHECKPOINT: No errors in terminal after docker compose up -d


## Phase 1 — CREATE THE LARAVEL PROJECT


#### STEP 1.1  Create the Project


    In your terminal, navigate to your projects folder:
      cd ~/projects   (Mac/Linux)
      cd C:\projects  (Windows)

    Run:
      composer create-project laravel/laravel erp

    This creates a folder called erp/ with a fresh Laravel 11 project inside.
    It will take 2–3 minutes to download.

    Enter the folder:
      cd erp

    Open VS Code on this folder:
      code .


#### STEP 1.2  Configure the .env File


    WHY: The .env file tells Laravel how to connect to your database,
    Redis, and mail server. It is never committed to Git (secret info).

    Open the file: .env  (it was created automatically)

    Find these lines and change them to match your Docker setup:

      DB_CONNECTION=mysql
      DB_HOST=127.0.0.1
      DB_PORT=3306
      DB_DATABASE=erp_db
      DB_USERNAME=erp_user
      DB_PASSWORD=erp_pass

      CACHE_STORE=redis
      SESSION_DRIVER=redis
      QUEUE_CONNECTION=redis

      REDIS_HOST=127.0.0.1
      REDIS_PORT=6379

    NOTE: DB_CONNECTION stays as "mysql" even though we use MariaDB.
    Laravel uses the same driver for both. This is normal and correct.


#### STEP 1.3  Connect to GitHub


    Inside your erp/ folder, run these commands one by one:

      git init
      git add .
      git commit -m "Initial Laravel project"
      git branch -M main
      git remote add origin https://github.com/YOUR_USERNAME/erp-system.git
      git push -u origin main

    Replace YOUR_USERNAME with your GitHub username.

    IMPORTANT: Before the first push, make sure .gitignore contains:
      .env
    It should already be there in Laravel's default .gitignore.
    NEVER remove that line.


#### STEP 1.4  Test the Installation


    Run the Laravel development server:
      php artisan serve

    Open your browser: http://localhost:8000
    You should see the default Laravel welcome page.

    ✓ CHECKPOINT: Welcome page loads
    ✓ CHECKPOINT: No database errors in the terminal


## Phase 2 — INSTALL ALL PACKAGES


  WHY THIS PHASE EXISTS:
    Our project uses tools written by other developers (called packages).
    We install them once now so they are ready when we need them later.
    Think of it like buying all your construction materials before building.


#### STEP 2.1  Install PHP (Composer) Packages


    Run this one command in your terminal (inside the erp/ folder):

      composer require \
        laravel/sanctum \
        spatie/laravel-permission \
        spatie/laravel-medialibrary \
        barryvdh/laravel-dompdf \
        maatwebsite/excel \
        darkaonline/l5-swagger \
        nwidart/laravel-modules \
        predis/predis

    Wait for it to finish (2–5 minutes).

    WHAT EACH PACKAGE DOES:
      laravel/sanctum              Login tokens for SPA and API
      spatie/laravel-permission    Roles and permissions (who can do what)
      spatie/laravel-medialibrary  Upload and manage product images
      barryvdh/laravel-dompdf      Generate PDF invoices and receipts
      maatwebsite/excel            Import/export Excel and CSV files
      darkaonline/l5-swagger       Auto-generate API documentation
      nwidart/laravel-modules      HRM module system
      predis/predis                PHP library to talk to Redis


#### STEP 2.2  Install JavaScript (npm) Packages


    Run:
      npm install vue@latest @vitejs/plugin-vue pinia axios vee-validate@4 \
        @vee-validate/rules chart.js vue-chartjs

    WHAT EACH PACKAGE DOES:
      vue                  The Vue 3 framework (frontend UI)
      @vitejs/plugin-vue   Teaches Vite how to compile .vue files
      pinia                Vue state management (shared data store)
      axios                Makes HTTP calls to our API
      vee-validate         Form validation on the frontend
      chart.js             Draws charts for the dashboard


#### STEP 2.3  Publish Package Config Files


    Run each of these commands:

      php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
      php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
      php artisan vendor:publish --tag="medialibrary-migrations"

    These commands copy config and migration files from the packages
    into your project so you can customise them.


#### STEP 2.4  Configure Vite for Vue


    Open vite.config.js and replace its contents with:

    ┌─────────────────────────────────────────────────────────────────────┐
    │  vite.config.js                                                      │
    ├─────────────────────────────────────────────────────────────────────┤
    │  import { defineConfig } from 'vite'                                 │
    │  import laravel from 'laravel-vite-plugin'                           │
    │  import vue from '@vitejs/plugin-vue'                                │
    │  import { resolve } from 'path'                                      │
    │  import { glob } from 'glob'                                         │
    │                                                                      │
    │  const pageEntries = Object.fromEntries(                             │
    │    glob.sync('resources/js/pages/**/index.js').map(file => [         │
    │      file.replace('resources/js/', '').replace('/index.js', ''),     │
    │      resolve(__dirname, file)                                        │
    │    ])                                                                │
    │  )                                                                   │
    │                                                                      │
    │  export default defineConfig({                                       │
    │    plugins: [                                                        │
    │      laravel({ input: Object.values(pageEntries), refresh: true }),  │
    │      vue(),                                                          │
    │    ],                                                                │
    │    resolve: {                                                        │
    │      alias: {                                                        │
    │        '@': resolve(__dirname, 'resources/js'),                      │
    │        '@comps': resolve(__dirname, 'resources/js/components'),      │
    │        '@api': resolve(__dirname, 'resources/js/api'),               │
    │        '@stores': resolve(__dirname, 'resources/js/stores'),         │
    │      }                                                               │
    │    }                                                                 │
    │  })                                                                  │
    └─────────────────────────────────────────────────────────────────────┘

    WHY: This config tells Vite to auto-discover every page's index.js
    so you never have to manually register new pages. It also sets up
    short import paths like @comps/ instead of ../../components/.


#### STEP 2.5  Commit Your Progress


    Always commit at the end of each phase. This gives you a safe save point.

      git add .
      git commit -m "Phase 2: Install all packages and configure Vite"
      git push

    ✓ CHECKPOINT: No errors from any composer or npm command
    ✓ CHECKPOINT: vite.config.js saved with Vue plugin


## Phase 3 — BUILD THE FOUNDATION LAYER (Weeks 1–2)


  WHY FIRST:
    Everything else in the system depends on this layer.
    BaseModel gives every model its UUID and tenant isolation.
    Without it, models cannot be built. Without tenant isolation,
    data from one client leaks to another — a fatal security flaw.


#### STEP 3.1  Create the Traits


    Traits are reusable pieces of code that you attach to multiple classes.
    We need three of them.

    CREATE FILE: app/Traits/HasUuid.php

    HOW TO GET THE CODE:
      Ask the AI: "Write the HasUuid trait for Laravel 11. It must
      auto-generate a UUID v4 when a model is first created, before
      it is saved. UUID stored as CHAR(36). Use Str::uuid()."

    WHAT IT DOES:
      Every time you create a new record (e.g. a new product), this trait
      automatically generates a unique ID like: 550e8400-e29b-41d4-a716-446655440000
      You never have to set the ID manually.

    CREATE FILE: app/Traits/BelongsToTenant.php

    HOW TO GET THE CODE:
      Ask the AI: "Write the BelongsToTenant trait for Laravel 11.
      It must add a global scope that automatically filters all queries
      by business_id using app('tenant')->id. Include a static method
      withoutTenant() to bypass the scope when needed."

    WHAT IT DOES:
      If a user from Business A is logged in, every database query
      automatically adds WHERE business_id = 'business-a-uuid'.
      Business A can never accidentally see Business B's data.
      This is multi-tenancy.

    CREATE FILE: app/Traits/HasUserTracking.php

    HOW TO GET THE CODE:
      Ask the AI: "Write the HasUserTracking trait for Laravel 11.
      It must auto-set created_by and updated_by from auth()->id()
      on every model create and update event."

    WHAT IT DOES:
      Every record automatically knows which user created or changed it.
      This is required for the audit log.


#### STEP 3.2  Create the BaseModel


    CREATE FILE: app/Models/BaseModel.php

    HOW TO GET THE CODE:
      Ask the AI using Prompt B from Section 10:
      "Build the BaseModel for Laravel 11. It must:
       - Extend Illuminate\Database\Eloquent\Model
       - Use HasUuid, BelongsToTenant, HasUserTracking, SoftDeletes traits
       - Set $incrementing = false and $keyType = 'string'
       - Set $guarded = [] (allow mass assignment on child models)
       Include a PHPDoc block explaining what each trait adds."

    WHY $incrementing = false:
      By default Laravel uses auto-increment numbers (1, 2, 3...) as IDs.
      We use UUIDs instead, so we tell Laravel not to auto-increment.

    WHY $guarded = []:
      This allows us to pass data directly to create(). Child models
      will define their own $fillable lists for security.


#### STEP 3.3  Create the Exception Handler


    Our services throw custom exceptions when something goes wrong
    (e.g. not enough stock). The handler catches them and sends a
    clean JSON error back to the Vue frontend.

    CREATE FILE: app/Exceptions/Domain/DomainException.php
    CREATE FILE: app/Exceptions/Domain/InsufficientStockException.php
    CREATE FILE: app/Exceptions/Domain/InsufficientLotQtyException.php
    CREATE FILE: app/Exceptions/Domain/SerialNotFoundException.php
    CREATE FILE: app/Exceptions/Domain/SerialAlreadySoldException.php
    CREATE FILE: app/Exceptions/Domain/DuplicateSerialException.php
    CREATE FILE: app/Exceptions/Domain/InvalidStateTransitionException.php
    CREATE FILE: app/Exceptions/Domain/UnbalancedJournalException.php
    CREATE FILE: app/Exceptions/Domain/LotExpiredException.php
    CREATE FILE: app/Exceptions/Domain/LotRecalledException.php

    HOW TO GET THE CODE (do all in one request):
      Ask the AI: "Write all domain exception classes listed in
      app/Exceptions/Domain/ for our ERP. DomainException is the base
      and extends \RuntimeException. All others extend DomainException.
      Each should have a constructor with a clear default message."

    Then update app/Exceptions/Handler.php:
      Ask the AI: "Update app/Exceptions/Handler.php to return JSON
      responses for all DomainException subclasses with HTTP 400,
      and for ModelNotFoundException with HTTP 404.
      Format: { success: false, message: '...' }"


#### STEP 3.4  Create the Tenant Middleware


    CREATE FILE: app/Http/Middleware/TenantResolver.php

    HOW TO GET THE CODE:
      Ask the AI: "Write TenantResolver middleware for Laravel 11.
      It reads the authenticated user's business_id from the Sanctum
      token, loads the Business model, and binds it to app('tenant').
      If business_id is missing or business is suspended/cancelled,
      return 403 JSON error."

    Then register it in bootstrap/app.php (Laravel 11 style):
      Ask the AI: "Show me how to register TenantResolver middleware
      in Laravel 11's bootstrap/app.php and apply it to all
      api/* routes using a middleware group."


#### STEP 3.5  Create Group A Migrations


    Now you build your first database tables. This is one of the most
    important steps — get the columns right now so you don't have to redo
    migrations later.

    HOW TO CREATE A MIGRATION:
      php artisan make:migration create_businesses_table

    This creates a file in database/migrations/ with the current timestamp.
    Open it and replace the contents with the code from the AI.

    Do this for each Group A table in order:

      MIGRATION 0001 — businesses
        Ask the AI using Prompt A from Section 10:
        "Write the migration for the businesses table. Use the column
        spec from Section 2 of the ERP plan. Include:
        name, legal_name, tax_id, email(unique), phone, currency(CHAR 3),
        timezone, country(CHAR 2), address(JSON), logo_url, tier(ENUM),
        status(ENUM), max_users, max_branches, financial_year(JSON),
        settings_cache(JSON). Add composite index on (status, created_at).
        No business_id column — businesses IS the tenant root."

      MIGRATION 0002 — branches
        columns: business_id, name, code(unique per business), phone,
        email, address(JSON), is_default(boolean), is_active(boolean)

      MIGRATION 0003 — warehouses
        columns: business_id, branch_id(FK), name, code(unique per business),
        address(JSON), is_default(boolean), is_active(boolean)

      MIGRATION 0004 — users
        columns: business_id, name, email(unique), password,
        phone, branch_id(nullable FK), avatar_url,
        is_active(boolean), email_verified_at, remember_token

      MIGRATION 0005 — Spatie tables
        Already created by: php artisan vendor:publish --provider="Spatie\Permission\..."
        Just run it as-is.

      MIGRATION 0006 — settings
        columns: business_id, group(VARCHAR), key(VARCHAR), value(TEXT),
        label(VARCHAR), type(ENUM: text|number|boolean|json),
        unique(business_id + group + key together)

      MIGRATION 0007 — audit_logs
        columns: business_id, user_id(nullable), action(VARCHAR),
        model_type(VARCHAR), model_id(CHAR 36), old_values(JSON nullable),
        new_values(JSON nullable), ip_address, user_agent
        NO updated_at (append-only, never update an audit log)

    After writing all migrations, run them:
      php artisan migrate

    Then open phpMyAdmin at http://localhost:8080 and check that all
    7 tables were created correctly. Look at the columns and confirm
    they match what you designed.

    ✓ CHECKPOINT: php artisan migrate runs with no errors
    ✓ CHECKPOINT: All 7 Group A tables visible in phpMyAdmin


#### STEP 3.6  Create Group A Models


    Now you create the PHP classes that represent each table.
    These are called Eloquent models.

    HOW TO CREATE A MODEL:
      php artisan make:model Business

    This creates app/Models/Business.php. Then open it and replace
    its contents with the code from the AI.

    Create models for: Business, Branch, Warehouse, User, Setting, AuditLog

    For each one, ask the AI using Prompt B from Section 10.
    Example for Branch:
      "Build the Branch Eloquent model. Extends App\Models\BaseModel.
       Relationships: belongsTo Business, belongsTo Warehouse (default),
       hasMany Users, hasMany Warehouses.
       Scopes: active() filters where is_active = 1."

    IMPORTANT for User model:
      User extends Authenticatable (not BaseModel) but must still
      use the HasUuid and BelongsToTenant traits manually.
      Ask the AI: "Write the User model for Laravel 11 ERP.
      It must extend Authenticatable, use HasUuid, BelongsToTenant,
      HasUserTracking, HasRoles (Spatie), HasApiTokens (Sanctum).
      Include all relationships listed in Section 12."


#### STEP 3.7  Build the BaseApiController


    CREATE FILE: app/Http/Controllers/Api/V1/BaseApiController.php

    HOW TO GET THE CODE:
      Ask the AI: "Write BaseApiController for Laravel 11.
      It must have helper methods:
      - success(\$data, \$message, \$status=200): JsonResponse
      - paginated(\$collection, \$resource): JsonResponse
        (returns data + meta with current_page, last_page, total)
      - error(\$message, \$status=400): JsonResponse
      All methods return { success: bool, message: string, data: mixed }"


#### STEP 3.8  Build Auth


    CREATE FILE: app/Http/Controllers/Api/V1/Auth/AuthController.php

    HOW TO GET THE CODE:
      Ask the AI using Prompt D from Section 10:
      "Build AuthController for Laravel 11 with Sanctum SPA auth.
       Endpoints:
       POST /api/v1/auth/login  — validate email+password, return token + user
       POST /api/v1/auth/logout — revoke current token
       GET  /api/v1/auth/me    — return authenticated user with permissions
       Use auth()->user() and Sanctum token creation.
       Return UserResource on all user responses."

    Add routes in routes/api.php:
      Ask the AI: "Write the auth routes for routes/api.php using
      Laravel 11. Group under /api/v1/auth/ prefix. Login is public.
      Logout and me require auth:sanctum middleware."


#### STEP 3.9  Test Auth with a Tool


    Install a free API testing tool: Bruno (usebruno.com) or Postman (postman.com)

    First create a test user in the database via tinker:
      php artisan tinker
      > \App\Models\User::create(['name'=>'Test','email'=>'test@test.com',
          'password'=>bcrypt('password'),'business_id'=>'put-uuid-here'])

    (First create a business record via tinker too.)

    Then test:
      POST http://localhost:8000/api/v1/auth/login
      Body: { "email": "test@test.com", "password": "password" }

    Expected response:
      { "success": true, "data": { "token": "...", "user": {...} } }

    Copy the token. Use it as a Bearer token for all future requests.

    ✓ CHECKPOINT: Login returns a token
    ✓ CHECKPOINT: GET /api/v1/auth/me returns user data with that token
    ✓ CHECKPOINT: Wrong password returns 401


#### STEP 3.10  Create the Seeder and Default Data


    Seeders create starting data in your database automatically.

      php artisan make:seeder RolePermissionSeeder
      php artisan make:seeder DefaultSettingsSeeder
      php artisan make:seeder ChartOfAccountsSeeder

    HOW TO GET THE CODE:
      Ask the AI: "Write RolePermissionSeeder for our ERP using
      Spatie Permission. Create these roles:
      super_admin, admin, manager, cashier, accountant, inventory_manager.
      Create permissions for each resource following the pattern:
      {resource}.index, {resource}.create, {resource}.edit, {resource}.delete.
      Resources: users, branches, products, customers, sales, purchases,
      accounting, reports, settings."

    Run the seeders:
      php artisan db:seed --class=RolePermissionSeeder

    ✓ CHECKPOINT: Roles appear in the roles table in phpMyAdmin


#### STEP 3.11  Commit Phase 3


      git add .
      git commit -m "Phase 3: Foundation layer - BaseModel, Auth, Migrations, Traits"
      git push


## Phase 4 — SMARTADMIN UI SHELL (Week 2)


  WHY NOW:
    Before building any feature, you need the visual shell.
    Every page in this system is a Laravel Blade file that loads the
    SmartAdmin layout, then mounts a Vue app inside a <div id="page-app">.
    Build this shell once and reuse it forever.


#### STEP 4.1  Copy SmartAdmin Files


    You purchased SmartAdmin. Locate the downloaded ZIP file.
    Inside it, find the dist/ folder.
    Copy the entire dist/ folder to: public/smartadmin/

    Your structure should look like:
      public/smartadmin/css/vendors.min.css
      public/smartadmin/css/app.min.css
      public/smartadmin/js/vendors.bundle.js
      public/smartadmin/js/app.bundle.js


#### STEP 4.2  Create the Master Layout


    CREATE FILE: resources/views/layouts/app.blade.php

    HOW TO GET THE CODE:
      Ask the AI: "Write the SmartAdmin 4.5.1 master Blade layout for
      our Laravel ERP. Include:
      - All SmartAdmin CSS and JS from public/smartadmin/ via asset()
      - A sidebar with navigation links for all sections
        (Dashboard, Products, Inventory, Sales, Purchases, Accounting,
        Reports, Settings, HRM)
      - Fixed header and fixed sidebar using initApp.pushSettings()
      - @yield('content') in the main content area
      - @stack('scripts') before closing </body>
      - Dark/light mode toggle button
      - Notification bell icon in the header
      Use SmartAdmin's standard classes: page-wrapper, page-inner,
      page-content-wrapper, nav, nav-title, nav-item, nav-link."


#### STEP 4.3  Create the Dashboard Shell


    CREATE FILE: resources/views/dashboard/index.blade.php

    ┌─────────────────────────────────────────────────────────────────────┐
    │  dashboard/index.blade.php  (pattern used on EVERY page)            │
    ├─────────────────────────────────────────────────────────────────────┤
    │  @extends('layouts.app')                                            │
    │  @section('content')                                                │
    │    <div class="subheader">                                          │
    │      <h1 class="subheader-title">Dashboard</h1>                    │
    │    </div>                                                           │
    │    <div id="page-app"></div>                                        │
    │  @endsection                                                        │
    │  @push('scripts')                                                   │
    │    @vite('resources/js/pages/dashboard/index.js')                  │
    │  @endpush                                                           │
    └─────────────────────────────────────────────────────────────────────┘

    This is the exact same pattern for every single page. Only the title
    and the @vite path change.


#### STEP 4.4  Create the Dashboard Vue Page


    CREATE FILE: resources/js/pages/dashboard/index.js

    ┌─────────────────────────────────────────────────────────────────────┐
    │  resources/js/pages/dashboard/index.js                              │
    ├─────────────────────────────────────────────────────────────────────┤
    │  import { createApp } from 'vue'                                    │
    │  import { createPinia } from 'pinia'                                │
    │  import DashboardPage from './DashboardPage.vue'                    │
    │                                                                     │
    │  createApp(DashboardPage).use(createPinia()).mount('#page-app')     │
    └─────────────────────────────────────────────────────────────────────┘

    CREATE FILE: resources/js/pages/dashboard/DashboardPage.vue

    Start with a simple placeholder:

    ┌─────────────────────────────────────────────────────────────────────┐
    │  <template>                                                         │
    │    <div class="row">                                                │
    │      <div class="col-12">                                           │
    │        <div class="card">                                           │
    │          <div class="card-header"><h4>Dashboard</h4></div>         │
    │          <div class="card-body">                                    │
    │            <p>ERP System is running.</p>                           │
    │          </div>                                                     │
    │        </div>                                                       │
    │      </div>                                                         │
    │    </div>                                                           │
    │  </template>                                                        │
    │                                                                     │
    │  <script setup>                                                     │
    │  // DashboardPage - expand with charts in Phase 14                 │
    │  </script>                                                          │
    └─────────────────────────────────────────────────────────────────────┘


#### STEP 4.5  Add Web Route and Test


    Open routes/web.php and add:

      use App\Http\Controllers\Web\DashboardController;
      Route::middleware('auth')->group(function () {
          Route::get('/dashboard', [DashboardController::class, 'index'])
               ->name('dashboard');
      });

    CREATE FILE: app/Http/Controllers/Web/DashboardController.php

      <?php
      namespace App\Http\Controllers\Web;
      use App\Http\Controllers\Controller;
      class DashboardController extends Controller {
          public function index() { return view('dashboard.index'); }
      }

    Run the Vite dev server (new terminal tab):
      npm run dev

    Visit: http://localhost:8000/dashboard
    You should see the SmartAdmin shell with "ERP System is running."

    ✓ CHECKPOINT: SmartAdmin sidebar and header appear
    ✓ CHECKPOINT: No CSS or JS errors in the browser console (F12)


#### STEP 4.6  Create Shared Vue Components


    These are components you will use on almost every page.
    Build them now so they are ready.

    HOW TO GET THE CODE for each (one AI request per component):

    COMPONENT: resources/js/components/ui/DataTable.vue
      Ask the AI: "Write a reusable DataTable.vue component for Vue 3
      using SmartAdmin Bootstrap classes. Props: columns (array of
      {key, label, sortable}), rows (array), loading (boolean), total,
      currentPage, perPage. Emits: page-change, sort-change, search.
      Include a search input at the top, loading spinner overlay,
      and pagination controls at the bottom."

    COMPONENT: resources/js/components/ui/AppModal.vue
      Ask the AI: "Write a reusable AppModal.vue for Vue 3 using
      SmartAdmin modal classes. Props: show (boolean), title, size
      (sm/md/lg/xl). Emits: close. Uses slot for body content and
      a named slot 'footer' for action buttons."

    COMPONENT: resources/js/components/ui/ConfirmDelete.vue
      Ask the AI: "Write a ConfirmDelete.vue modal for Vue 3.
      Shows a warning message and two buttons: Cancel and Delete.
      Props: show (boolean), itemName (string).
      Emits: confirm, cancel."

    COMPONENT: resources/js/components/ui/StatusBadge.vue
      Ask the AI: "Write StatusBadge.vue for Vue 3. Takes a status
      string prop and renders a Bootstrap badge-pill with colours:
      active/paid/completed = success, pending/draft = warning,
      cancelled/overdue = danger, suspended = secondary."

    ✓ CHECKPOINT: Components created (they will be tested when first used)


## Phase 5 — BUILD YOUR FIRST COMPLETE FEATURE (Branches) — Weeks 2–3


  WHY BRANCHES FIRST:
    Branches is the simplest real feature: basic CRUD, no complex
    business logic, no stock, no accounting. It is the perfect feature
    to learn the full 16-step Golden Order before building harder features.
    Build it once perfectly and you know the pattern for every other feature.

  THE GOLDEN ORDER: (you do this for every single feature, in this order)
    1. Migration  2. Model  3. Form Requests  4. API Resource
    5. Repository  6. Service  7. API Controller  8. Web Controller
    9. Blade View  10. API JS file  11. Pinia Store  12. Vue Page  13. Tests


#### STEP 5.1  Migration


    php artisan make:migration create_branches_table

    Ask the AI using Prompt A:
    "Write the branches migration for our ERP. Columns: business_id(FK),
    name(varchar 255 required), code(varchar 50, unique per business),
    phone(varchar 20 nullable), email(varchar 255 nullable),
    address(JSON nullable), is_default(tinyint 1, default 0),
    is_active(tinyint 1, default 1), created_by(uuid nullable).
    Add unique index on (business_id, code).
    Add index on (business_id, is_active)."

    Run: php artisan migrate
    Check phpMyAdmin: branches table created? ✓


#### STEP 5.2  Model


    php artisan make:model Branch

    Ask the AI using Prompt B:
    "Build Branch model. Extends BaseModel. Fillable: name, code,
    phone, email, address, is_default, is_active. Casts: address→array,
    is_default→boolean, is_active→boolean. Relationships: belongsTo
    Business, hasMany Warehouse, hasMany User. Scopes: active()
    (where is_active=1), default() (where is_default=1)."


#### STEP 5.3  Form Requests


    php artisan make:request StoreBranchRequest
    php artisan make:request UpdateBranchRequest

    Ask the AI using Prompt E:
    "Write StoreBranchRequest and UpdateBranchRequest for branches.
    Fields: name(required string max 255), code(required unique per
    business_id, max 50), phone(nullable string), email(nullable email),
    address(nullable array), is_default(boolean), is_active(boolean).
    Unique rule for code must be scoped to business_id from auth user.
    Update request makes all fields optional (PATCH semantics)."


#### STEP 5.4  API Resource


    php artisan make:resource BranchResource

    Ask the AI using Prompt F:
    "Write BranchResource. Include: id, name, code, phone, email,
    address, is_default, is_active, created_at (formatted Y-m-d H:i).
    Use whenLoaded('warehouses') for the warehouses relationship."


#### STEP 5.5  Repository


    CREATE FILE: app/Repositories/Foundation/BranchRepository.php

    Ask the AI: "Write BranchRepository for Laravel 11 ERP.
    Extend a BaseRepository with these methods: all(\$filters),
    paginate(\$perPage, \$filters), findById(\$id), create(\$data),
    update(\$branch, \$data), delete(\$branch). The paginate method
    must support filtering by: name(LIKE), is_active, search term.
    All queries are auto-scoped to tenant by BelongsToTenant."

    Also create: app/Repositories/BaseRepository.php
    Ask the AI: "Write BaseRepository for Laravel 11 ERP.
    Abstract class. Constructor takes the model class name.
    Methods: all(), find(\$id), paginate(\$perPage), create(\$data),
    update(\$model, \$data), delete(\$model). Uses Redis to cache
    all() results with a key including business_id. Cache is busted
    on create, update, delete."


#### STEP 5.6  Service


    CREATE FILE: app/Services/Foundation/BranchService.php

    Ask the AI using Prompt C:
    "Write BranchService for the branches feature.
    Methods:
    - index(array \$filters): LengthAwarePaginator
    - store(array \$data): Branch — if is_default=true, unset default
      on all other branches first (DB transaction)
    - update(Branch \$branch, array \$data): Branch — same default logic
    - destroy(Branch \$branch): void — block if it is the last active branch
    Inject BranchRepository. Throw DomainException if destroying last branch."


#### STEP 5.7  API Controller


    php artisan make:controller Api/V1/Foundation/BranchController

    Ask the AI using Prompt D:
    "Write BranchController. Endpoints:
    GET    /api/v1/branches         (index — paginated, filterable)
    POST   /api/v1/branches         (store)
    GET    /api/v1/branches/{id}    (show)
    PUT    /api/v1/branches/{id}    (update)
    DELETE /api/v1/branches/{id}    (destroy)
    Use BranchService, BranchResource. Catch DomainException → 400 error."


#### STEP 5.8  Web Controller


    CREATE FILE: app/Http/Controllers/Web/Foundation/BranchController.php

      <?php
      namespace App\Http\Controllers\Web\Foundation;
      use App\Http\Controllers\Controller;
      class BranchController extends Controller {
          public function index() { return view('branches.index'); }
      }

    This controller does NOTHING except return the view.
    All data comes from the Vue page calling the API.


#### STEP 5.9  Blade View


    CREATE FILE: resources/views/branches/index.blade.php

    Use exactly the same pattern as the dashboard view (Step 4.3).
    Only change the title and the @vite path.


#### STEP 5.10  Add API and Web Routes


    In routes/api.php:
      Route::middleware(['auth:sanctum', 'tenant'])->prefix('v1')->group(function () {
          Route::apiResource('branches', BranchController::class);
      });

    In routes/web.php:
      Route::middleware('auth')->group(function () {
          Route::get('/branches', [BranchController::class, 'index'])->name('branches');
      });


#### STEP 5.11  API JS Service File


    CREATE FILE: resources/js/api/branches.js

    Ask the AI using Prompt G:
    "Write branches.js Axios API service for Vue 3 ERP frontend.
    Functions: fetchBranches(params), createBranch(data),
    updateBranch(id, data), deleteBranch(id), showBranch(id).
    Use a shared axios instance with the Sanctum CSRF cookie and
    base URL from import.meta.env.VITE_API_URL."

    CREATE FILE: resources/js/api/axios.js (shared instance):
    Ask the AI: "Write a shared Axios instance for our Vue 3 ERP SPA.
    It must: use withCredentials:true for Sanctum cookie auth, set
    Content-Type application/json, add a request interceptor to inject
    the Bearer token from localStorage, add a response interceptor to
    redirect to /login on 401 responses."


#### STEP 5.12  Pinia Store


    CREATE FILE: resources/js/stores/branches.js

    Ask the AI using Prompt G (stores section):
    "Write branches Pinia store for Vue 3. State: branches(array),
    currentBranch(null), loading(bool), error(null), pagination(obj).
    Actions: loadBranches(params), saveBranch(data), editBranch(id,data),
    removeBranch(id). Each action calls the branches.js API service,
    sets loading state, handles errors into the error state."


#### STEP 5.13  Vue Page


    CREATE FILE: resources/js/pages/branches/index.js  (same pattern as dashboard)
    CREATE FILE: resources/js/pages/branches/BranchesPage.vue

    Ask the AI using Prompt G:
    "Write BranchesPage.vue using Vue 3 Composition API (<script setup>).
    Uses: DataTable component, AppModal, ConfirmDelete, StatusBadge.
    Features:
    - Table shows: name, code, phone, is_default badge, is_active badge,
      actions (Edit, Delete)
    - Add Branch button opens modal with form
    - Form fields: name, code, phone, email, is_default toggle, is_active toggle
    - VeeValidate for validation
    - Uses branchesStore (Pinia) for all data operations
    - Delete shows ConfirmDelete modal before deleting"


#### STEP 5.14  Test the Feature


    API TESTS (use Bruno/Postman):
      GET    /api/v1/branches          → 200 with paginated list
      POST   /api/v1/branches          → 201 with new branch
      PUT    /api/v1/branches/{id}     → 200 with updated branch
      DELETE /api/v1/branches/{id}     → 200 or 400 (if last branch)

    UI TEST (browser):
      1. Go to http://localhost:8000/branches
      2. Click "Add Branch"
      3. Fill the form and save
      4. Branch appears in the table
      5. Click Edit — form pre-fills with existing data
      6. Click Delete — confirm dialog appears

    WRITE UNIT + FEATURE TESTS:
      php artisan make:test BranchApiTest --feature
      php artisan make:test BranchServiceTest --unit

      Ask the AI using Prompt H:
      "Write PHPUnit tests for BranchService (unit) and BranchController (feature).
      Cover: list branches, create branch, create sets default correctly,
      update branch, delete branch, cannot delete last branch (expects
      DomainException), unauthenticated request returns 401,
      wrong tenant cannot see another tenant's branch."

      Run tests: php artisan test --filter Branch

    ✓ CHECKPOINT: All API tests pass in Bruno
    ✓ CHECKPOINT: Branch UI fully functional in browser
    ✓ CHECKPOINT: PHPUnit tests all green


#### STEP 5.15  Commit Phase 5


      git add .
      git commit -m "Phase 5: Branches feature — full Golden Order complete"
      git push

  ── IMPORTANT LESSON FROM PHASE 5 ──────────────────────────────────────────

    You just built a complete feature in 14 steps following the Golden Order.
    Every feature from here follows this SAME pattern:
    Migration → Model → Requests → Resource → Repository → Service →
    API Controller → Web Controller → Blade → API.js → Store → Vue → Tests

    The ONLY thing that changes is the business logic in the Service layer.
    For simple features (categories, brands, tax rates), the service
    is as simple as Branches.
    For complex features (Sales, Stock, Accounting), the service is longer
    but the surrounding structure is identical.


## Phase 6 — BUILD REMAINING FOUNDATION FEATURES (Weeks 3–4)


  Follow the exact same 14-step Golden Order for each feature below.
  They are listed in order of dependency — build them in this sequence.

  Feature           Key business rule to add in the Service
  ----------------  --------------------------------------------------
  Warehouses        Must belong to a branch. Cannot delete if has stock.
  Users             Password hashing in Service (never raw). Assign role
                    via Spatie after save. Cannot delete self.
  Business          Single record per tenant. update() only (no store/delete
                    from API). Logo via Spatie Media Library.
  Settings          Key-value store. Cache in Redis after every update.
                    SettingsService: get(\$group, \$key), set(\$group, \$key, \$val),
                    getGroup(\$group), bust(\$businessId).
  Tax Rates         DECIMAL(5,2) for rate. Cannot delete if used in a product.
  Tax Groups        Has pivot table (tax_group_items). Service must sync
                    the items array in a transaction.
  Customer Groups   Simple CRUD. No complex rules.
  Customers         FULLTEXT search on name + phone + email.
                    Loyalty points balance as computed attribute.
  Suppliers         FULLTEXT search. Track outstanding balance.

  For each one, use the AI prompts from Section 10 and follow the same 14 steps.

  After all 9 features above are done:
    git commit -m "Phase 6: All foundation and configuration features complete"
    git push


## Phase 7 — CATALOG (Products) (Weeks 4–6)


  Products are the most complex catalog object. Build supporting tables first.


#### BUILD ORDER:

    1. ProductCategory  (simple CRUD, parent_id for 2-level hierarchy)
    2. Brand            (simple CRUD)
    3. Unit             (simple CRUD)
    4. SubUnit          (belongs to Unit, has conversion_factor)
    5. VariationTemplate + VariationValues  (template has many values)
    6. PriceGroup       (header only, simple CRUD)
    7. Product          ← main event, complex Service
    8. ProductVariation (created automatically by ProductService)
    9. ComboItem        (links products as combo components)
    10. PriceGroupPrice  (per-product price per group)

  PRODUCT SERVICE KEY RULES:
    - stock_tracking can be: none | lot | serial
    - Once stock movements exist for a product, stock_tracking is locked
    - Variable products generate ProductVariation rows on save
    - ProductService calls PriceGroupPrice to sync pricing per group
    - FULLTEXT search: whereFullText(['name','sku','barcode'], \$term)
    - Generate barcode via ProductService (Code128 format)

  HOW TO BUILD PRODUCT:
    Ask the AI using Prompt C:
    "Write ProductService for our ERP. It must handle:
    simple products, variable products (with variations), and combo
    products. On store(): create product, generate variations if variable,
    sync price group prices, lock stock_tracking if movements exist.
    Throw DomainException if trying to change stock_tracking when movements exist."

  ✓ CHECKPOINT: Can create a simple product, a variable product with sizes,
    and a combo product
  ✓ CHECKPOINT: FULLTEXT search returns results by name and barcode
  ✓ CHECKPOINT: stock_tracking cannot be changed after stock movements exist

  git commit -m "Phase 7: Catalog — products, variations, combos, price groups"
  git push


## Phase 8 — INVENTORY (Weeks 6–8)


  WHY THIS PHASE IS CRITICAL:
    StockMovementService is the most important service in the entire system.
    All sales, purchases, returns, and adjustments flow through it.
    If it has a bug, stock data becomes corrupt — there is no way to fix it
    retroactively. Build it carefully and test it thoroughly.


#### BUILD ORDER:

    1. stock_movements migration + model (append-only, no updated_at)
    2. stock_levels migration + model (GENERATED available_qty)
    3. stock_lots migration + model
    4. stock_serials migration + model
    5. StockMovementService (the core service — build this carefully)
    6. LotService (lot expiry, state changes, recall)
    7. SerialService (serial state machine)
    8. StockCount feature

  STOCKMOVEMENTSERVICE MUST HANDLE:

    createMovement(\$data) — the one method everything calls.
      For none-tracking products: update stock_levels only
      For lot products: update stock_levels AND stock_lots
      For serial products: update stock_levels AND stock_serials

    reserveStock(\$productId, \$warehouseId, \$qty, \$lots=[], \$serials=[])
      Called when a sale is confirmed (not yet completed).
      Increments reserved_qty. Does NOT deduct available_qty yet.
      Throws InsufficientStockException if qty < request.
      Throws LotExpiredException if selling from an expired lot.
      Throws SerialAlreadySoldException if serial is not in_stock.

    deductStock(\$productId, \$warehouseId, \$qty, \$lots=[], \$serials=[])
      Called when a sale is completed.
      Moves reserved_qty to null and decrements total_qty.
      Sets serial status to sold.

    returnToStock(\$productId, \$warehouseId, \$qty, \$lots=[], \$serials=[])
      Called on sale returns.
      Restores qty. Sets serial status back to in_stock.

    selectLotsFIFO(\$productId, \$warehouseId, \$qty)
      Auto-selects which lots to use for a sale.
      Uses FIFO: oldest lot first. Skips expired and recalled lots.
      If one lot has qty 5 and you need 8, spans to next lot.

    HOW TO GET THE CODE:
      Ask the AI using Prompt C (this is your most important AI request):
      "Write StockMovementService for our Laravel 11 ERP. Use the rules
      from Section 9 of the plan (strict rules 13, 17, 18, 19, 20) and
      the architecture from Section 1. Include all 5 core methods above
      with full typed PHP 8.2 signatures. All writes in DB::transaction().
      Throw typed domain exceptions for every rule violation."

  ✓ CHECKPOINT: Manually add stock via adjustment, confirm level increases
  ✓ CHECKPOINT: Create lot product, add lot, adjust qty, confirm lot qty updates
  ✓ CHECKPOINT: Create serial product, assign serial, confirm status = in_stock
  ✓ CHECKPOINT: FIFO test: add lot A (qty 3), lot B (qty 5), sell 7 units,
    confirm lot A fully consumed, lot B has 1 remaining

  git commit -m "Phase 8: Inventory — StockMovementService, lots, serials, counts"
  git push


## Phase 9 — ACCOUNTING BEFORE SALES (Week 8–9)


  WHY BEFORE SALES:
    Strict Rule 9 in the plan says: "Build Accounting BEFORE Sales."
    Every sale creates accounting journal entries automatically.
    If accounting is not built first, you cannot attach journals to sales.


#### BUILD ORDER:

    1. chart_of_accounts migration + model + seeder (21 default accounts)
    2. fiscal_years migration + model
    3. payment_accounts migration + model
    4. account_transactions migration + model (append-only)
    5. journals migration + model
    6. journal_entries migration + model (append-only, no updated_at)
    7. AccountingService (postJournal, reverseJournal, postSaleJournal, etc.)

  CHART OF ACCOUNTS SEEDER:
    Ask the AI: "Write ChartOfAccountsSeeder for our ERP. Create these
    21 default accounts: Cash, Bank Account, Accounts Receivable, Inventory,
    Fixed Assets (Assets); Accounts Payable, Tax Payable (Liabilities);
    Owner Equity, Retained Earnings (Equity); Sales Revenue, Other Income
    (Revenue); Cost of Goods Sold, Salaries Expense, Rent Expense, Utilities,
    Marketing, Depreciation, Other Expense (Expenses). Use proper account
    type and normal balance (debit/credit) for each."

  ACCOUNTINGSERVICE KEY METHODS:
    postJournal(\$description, \$lines, \$sourceType, \$sourceId)
      \$lines = [['account_id'=>'...', 'type'=>'debit', 'amount'=>100.00], ...]
      Validates sum(debit) == sum(credit). Throws UnbalancedJournalException.
      Creates journal header + entries in one transaction. Returns journal.

    reverseJournal(\$journalId, \$reason)
      Creates a new opposite journal (debits become credits, vice versa).
      Never modifies the original. Links to original via reversed_from_id.

    postSaleJournal(\$sale)
      Automatic call from SaleService on complete.
      Dr Accounts Receivable / Cr Sales Revenue
      Dr Cost of Goods Sold / Cr Inventory

  ✓ CHECKPOINT: Post a manual journal, sum of debits equals credits
  ✓ CHECKPOINT: Reverse a journal — both journals visible in ledger
  ✓ CHECKPOINT: Unbalanced journal throws exception

  git commit -m "Phase 9: Accounting — COA, journals, double-entry, AccountingService"
  git push


## Phase 10 — SALES AND POS (Weeks 9–12)


#### BUILD ORDER:

    1. CashRegister + CashRegisterSession
    2. sales + sale_items migrations and models
    3. sale_item_lots + sale_item_serials (only needed for lot/serial products)
    4. sale_payments
    5. sale_returns + sale_return_items
    6. SaleService (calls StockMovementService + AccountingService)
    7. POS Vue page (the most complex Vue component in the project)

  SALE STATE MACHINE:
    draft → confirmed → completed → (partially_returned | fully_returned)
    draft → cancelled

    On CONFIRM: reserveStock() called
    On COMPLETE: deductStock() called + postSaleJournal()
    On CANCEL (if was confirmed): releaseReservation()
    On RETURN: returnToStock() + reverse journal (partial amount)

  POS PAGE SPECIAL RULES:
    - Product search uses FULLTEXT API
    - Lot products show LotSelector.vue panel (choose which lot)
    - Serial products show SerialScanner.vue (scan or type serial)
    - FIFO can be applied automatically if setting is enabled
    - Cash register session must be open before POS can process sales
    - Payment can be split: cash + card + credit

  HOW TO GET SALE SERVICE:
    Ask the AI using Prompt C:
    "Write SaleService for our Laravel 11 ERP. It must:
    - createDraft(\$data): Sale
    - confirmSale(\$sale): Sale — reserveStock for each item
    - completeSale(\$sale, \$payments): Sale — deductStock + postSaleJournal
      + record payments + award loyalty points
    - cancelSale(\$sale): Sale — release reservation if confirmed
    - processSaleReturn(\$sale, \$returnItems): SaleReturn — returnToStock
      + reverse partial journal
    All in DB::transaction(). Inject StockMovementService, AccountingService,
    LoyaltyService, SaleRepository."

  ✓ CHECKPOINT: Create a sale with 3 items including one lot product
  ✓ CHECKPOINT: Confirm sale — stock reserved, not yet deducted
  ✓ CHECKPOINT: Complete sale — stock deducted, journal posted, payment recorded
  ✓ CHECKPOINT: Return 1 item — stock restored, journal reversed for that amount
  ✓ CHECKPOINT: POS adds items, selects lot, processes payment

  git commit -m "Phase 10: Sales and POS — state machine, payments, returns"
  git push


## Phase 11 — PURCHASES (Weeks 12–13)


#### BUILD ORDER:

    1. purchases + purchase_items migrations and models
    2. purchase_receives + purchase_receive_items
    3. purchase_receive_lots + purchase_receive_serials  (v4 additions)
    4. purchase_returns + purchase_return_items
    5. purchase_payments
    6. PurchaseService

  KEY DIFFERENCE FROM SALES:
    Stock is added when goods are RECEIVED, not when the PO is created.
    Receive can be partial (receive 40 of 100 ordered).
    Lot numbers and serial numbers are entered at RECEIVE time.

  PURCHASE RECEIVE WITH LOTS:
    When receiving a lot product, the user enters:
      - lot_number (e.g. LOT-2026-001)
      - quantity received
      - expiry_date (if applicable)
      - supplier_lot_ref (supplier's own batch reference)

  PURCHASE RECEIVE WITH SERIALS:
    When receiving a serial product, the user enters or scans:
      - One serial number per unit (serial quantity is always 1)
      - System creates one stock_serials row per serial
      - Throws DuplicateSerialException if serial already exists in this business

  ✓ CHECKPOINT: Create a PO with 3 items, partially receive 2 items
  ✓ CHECKPOINT: Receive lot product — lot row created with correct qty
  ✓ CHECKPOINT: Receive serial product — one serial row per unit
  ✓ CHECKPOINT: Duplicate serial blocked at receive time

  git commit -m "Phase 11: Purchases — PO, receive with lots and serials, returns"
  git push


## Phase 12 — EXPENSES AND PAYMENTS (Week 13–14)


#### BUILD ORDER:

    1. ExpenseCategory + Expense (simple CRUD + accounting journal on create)
    2. InstallmentPlan + InstallmentSchedule (auto-generate schedule rows)
    3. SalePaymentService (additional payments on open invoices)
    4. PurchasePaymentService (payments to suppliers)


#### INSTALLMENT SERVICE:

    On createPlan(\$sale, \$data):
      - Calculate number of installments and amount per installment
      - Generate InstallmentSchedule rows with due dates
      - All in one transaction

    On recordPayment(\$schedule, \$amount):
      - Mark schedule row as paid
      - Post accounting journal (Dr Payment Account / Cr AR)
      - If all schedules paid, mark plan as fully_paid

  ✓ CHECKPOINT: Record an expense — journal posted automatically
  ✓ CHECKPOINT: Create installment plan for a sale — schedule rows generated
  ✓ CHECKPOINT: Pay one installment — journal posted, schedule marked paid

  git commit -m "Phase 12: Expenses, installments, payment accounts"
  git push


## Phase 13 — REPORTS (Week 14–15)


  Reports have no state machine, no stock changes, no accounting posts.
  They only READ data and format it for display or export.

  BUILD ORDER (all in ReportService):
    Group A — Sales reports:
      1. Sales Summary (by date range, branch, cashier)
      2. Sales by Product
      3. Sales by Customer
      4. Payment Methods Summary
      5. Profit & Loss (Revenue minus COGS from journals)

    Group B — Inventory reports:
      6. Stock Levels (current qty per product per warehouse)
      7. Stock Movements History
      8. Low Stock Alert (below reorder level)
      9. Lot Expiry Report (expiring in X days)
      10. Lot Recall Report (recalled lots)
      11. Serial Number History (full lifecycle per serial)

    Group C — Purchase reports:
      12. Purchase Summary
      13. Purchase by Supplier
      14. Goods Received Note

    Group D — Accounting reports:
      15. Trial Balance
      16. Profit & Loss Statement
      17. Balance Sheet
      18. General Ledger
      19. Customer Statement
      20. Supplier Statement

    Group E — Other reports:
      21. Expense Summary
      22. Customer Loyalty Points
      23. Cash Register Summary
      24. Installment Schedule Report
      25. Audit Log Report

  HOW TO BUILD:
    All 25 reports live in one ReportService class with one method per report.
    Each method takes \$filters (date_from, date_to, branch_id, etc.) and
    returns a collection of data.

    Ask the AI for 3–5 reports at a time:
    "Write these ReportService methods for our Laravel 11 ERP:
    1. getSalesSummary(\$filters): array — ...
    2. getStockLevels(\$filters): Collection — ..."

  EXPORT TO EXCEL:
    Each report can be exported to Excel via maatwebsite/excel.
    Ask the AI: "Write a generic ReportExport class using Laravel Excel
    that takes a report name and data array and exports to XLSX."

  ✓ CHECKPOINT: Sales summary shows correct totals for a date range
  ✓ CHECKPOINT: Lot expiry report shows lots expiring in the next 30 days
  ✓ CHECKPOINT: Trial balance debits equal credits
  ✓ CHECKPOINT: Export works — XLSX downloads with correct data

  git commit -m "Phase 13: Reports — all 25 reports + Excel export"
  git push


## Phase 14 — DASHBOARD AND NOTIFICATIONS (Week 15–16)


  DASHBOARD (update DashboardPage.vue):
    KPI cards: Today's sales, Total customers, Low stock items, Pending POs
    Charts: Sales trend (7 days), Revenue vs Expenses (monthly), Top 5 products
    Alerts: Expiring lots, Low stock, Overdue installments

  NOTIFICATIONS:
    Use Laravel's built-in notification system.
    Events that trigger notifications:
      - Stock falls below reorder level → Low Stock Alert
      - Lot expires in 7 days → Lot Expiry Warning
      - Installment overdue → Payment Reminder

    Schedule the lot expiry check in app/Console/Kernel.php:
      \$schedule->command('notifications:check-lot-expiry')->daily();

  ✓ CHECKPOINT: Dashboard shows real data from the database
  ✓ CHECKPOINT: Notification bell shows unread count
  ✓ CHECKPOINT: Low stock notification appears when qty falls below reorder level

  git commit -m "Phase 14: Dashboard charts, KPIs, notifications system"
  git push


## Phase 15 — HRM MODULE (Weeks 16–18)


  Build the HRM module using nwidart/laravel-modules.
  Follow the same Golden Order but in the Modules/HRM/ folder.

  Features: Departments, Designations, Employees, Attendance, Leave, Payroll

  KEY RULES:
    - HRM models extend app/Models/BaseModel (never duplicate base classes)
    - HRM service classes are self-contained (no cross-module calls to app/)
    - Payroll is a read-only summary (no accounting journal from HRM — optional)
    - Leave balance uses GENERATED COLUMN: total_days - used_days

  git commit -m "Phase 15: HRM module — employees, attendance, leave, payroll"
  git push


## Phase 16 — TESTING AND QUALITY (Week 18–20)


  GOAL: 80% test coverage on Services and API Controllers.


#### TEST PRIORITIES (highest risk first):

    1. StockMovementService — every path (none/lot/serial, FIFO, expiry block)
    2. AccountingService — balanced journals, reversal, auto-posting
    3. SaleService — full state machine transitions
    4. PurchaseService — receive with lots and serials
    5. TenantResolver — cross-tenant data isolation

  FINAL CHECKS:
    Run: php artisan test
    Target: 0 failures, 0 errors, 80%+ coverage

    Run: php artisan route:list
    Check: all expected API routes exist

    Run: npm run build
    Check: no build errors. Assets compiled to public/build/


## Phase 17 — PREPARATION FOR FIRST CLIENT (Weeks 20–26)


#### STEP 17.1  Multi-Tenancy Registration Flow


    Build: public /register page where a new client creates their business.
    This creates: Business record + first admin User + default Settings + COA seeder.


#### STEP 17.2  Subscription Tiers


    Enforce: Business.max_users and Business.max_branches in middleware.
    Throw 403 if limit exceeded with a clear upgrade message.


#### STEP 17.3  Demo Data Seeder


    Create a DemoSeeder that populates a business with:
    5 products (simple, variable, lot, serial, combo), 10 customers,
    3 suppliers, 20 sales, 5 purchases, 2 employees.
    This is used to demo the system to potential clients.


#### STEP 17.4  API Documentation


    Generate Swagger docs:
      php artisan l5-swagger:generate
    Visit: http://localhost:8000/api/documentation


#### STEP 17.5  Performance Audit


    Install Laravel Telescope for development:
      composer require laravel/telescope --dev
      php artisan telescope:install

    Check every API endpoint for N+1 queries.
    Any endpoint making more than 5 queries needs eager loading fixed.


#### STEP 17.6  Security Checklist Before Going Live


    [ ] .env is never in Git
    [ ] All sensitive routes require auth:sanctum
    [ ] TenantResolver middleware active on all API routes
    [ ] All form inputs go through Form Requests
    [ ] No raw SQL queries (all via Eloquent or DB query builder)
    [ ] Password hashing uses bcrypt (never store plain text)
    [ ] CORS configured in config/cors.php for your domain only
    [ ] Laravel debug mode OFF in production (.env: APP_DEBUG=false)
    [ ] All file uploads validated for mime type and size


#### STEP 17.7  Deployment


    For production deployment, you will need:
    - A Linux server (Ubuntu 22.04 recommended) or cloud host (DigitalOcean, Hetzner)
    - Nginx as the web server
    - PHP 8.2 with required extensions
    - MariaDB 10.11 (production, not Docker)
    - Redis (production)
    - SSL certificate (free via Let's Encrypt)
    - Supervisor to run queue workers

    Ask the AI when you reach this step:
    "Write a deployment checklist and nginx + supervisor config for
    deploying our Laravel 11 ERP to an Ubuntu 22.04 server with
    MariaDB 10.11, Redis, and Let's Encrypt SSL."

DAILY WORK ROUTINE (follow this every day)

  START OF DAY:
    1. docker compose up -d          (start database and redis)
    2. php artisan serve             (start Laravel in one terminal)
    3. npm run dev                   (start Vite in another terminal)
    4. Open VS Code
    5. Check your current phase and which step you are on

  DURING WORK:
    6. Build one step at a time (Migration → Model → Request → ... → Tests)
    7. Test each step in the browser or API tool before moving to the next
    8. If stuck: show the error to the AI with Prompt I from Section 10
    9. Never spend more than 30 minutes stuck on the same error without asking

  END OF DAY:
    10. php artisan test             (make sure nothing is broken)
    11. git add . && git commit -m "Describe what you built today"
    12. git push

  COMMIT MESSAGE FORMAT:
    "Phase X Step Y.Z: What you built"
    Example: "Phase 5 Step 5.7: API Controller for branches with tests"


## Common Beginner Mistakes And How To Avoid Them


  Mistake                              How to avoid it
  -----------------------------------  -----------------------------------------
  Skipping migrations and editing      Never change a table by hand. Always create
  the DB manually in phpMyAdmin        a new migration and run php artisan migrate.

  Putting business logic in a          Every "if/then" rule belongs in a Service.
  Controller method                    Controllers only receive, delegate, respond.

  Forgetting DB::transaction()         Any method that writes to 2+ tables must
  on multi-table writes                be wrapped in DB::transaction().

  Returning raw Eloquent models        Always use an API Resource. Never return
  from API endpoints                   \$model directly from a controller.

  Hardcoding business_id               Use BelongsToTenant and auth()->user()->
  in queries                           business_id. Never hardcode a UUID.

  Committing the .env file             Run: git status. If .env appears, add it
                                       to .gitignore immediately.

  Building frontend before the API     The Vue page must call real API endpoints.
  endpoint exists                      Build and test the API first.

  Not running tests after changes      Run php artisan test after every feature.
                                       Broken code spreads to other features.

  Changing a migration that was        Never. Create a new migration to alter
  already run on a shared DB           the table. Only change migrations that
                                       have never been run by anyone else.

  Getting overwhelmed by the           Follow one phase at a time. One step at
  size of the project                  a time. The system builds itself if you
                                       follow the order.


## Phase Completion Tracker


  Phase   Name                                        Done?   Week
  ------  ------------------------------------------  ------  ------
  0       Computer Setup                              [ ]     Before start
  1       Create Laravel Project                      [ ]     Week 1
  2       Install All Packages                        [ ]     Week 1
  3       Foundation Layer                            [ ]     Week 1–2
  4       SmartAdmin UI Shell                         [ ]     Week 2
  5       First Feature (Branches — Golden Order)     [ ]     Week 2–3
  6       Remaining Foundation Features               [ ]     Week 3–4
  7       Catalog (Products)                          [ ]     Week 4–6
  8       Inventory (StockMovementService)            [ ]     Week 6–8
  9       Accounting (before Sales)                   [ ]     Week 8–9
  10      Sales and POS                               [ ]     Week 9–12
  11      Purchases with Lots and Serials             [ ]     Week 12–13
  12      Expenses and Payments                       [ ]     Week 13–14
  13      Reports (all 25)                            [ ]     Week 14–15
  14      Dashboard and Notifications                 [ ]     Week 15–16
  15      HRM Module                                  [ ]     Week 16–18
  16      Testing and Quality                         [ ]     Week 18–20
  17      First Client Preparation                    [ ]     Week 20–26

END OF SECTION 13
