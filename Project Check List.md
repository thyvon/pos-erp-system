# Project Check List

## Catalog Frontend Rebuild

- [x] Units page, form, API hooks, types, and translations are present.
- [x] Price Groups page, form, API hooks, types, navigation, and translations are present.
- [x] Variation Templates page, form, API hooks, types, navigation, and translations are present.
- [x] Rack Locations page, form, API hooks, types, navigation, warehouse filtering, and translations are present.
- [x] Rack Locations focused backend test and frontend type-check verified.
- [x] Products page, form, API hooks, types, navigation, CRUD states, filters, and translations are present.
- [x] Products focused backend test, frontend type-check, and frontend lint verified.
- [x] Product create/edit now uses dedicated page forms instead of a large modal.
- [x] Variable product items use a generated variation matrix table from selected template values.
- [x] Product page form is split into maintainable section components under `frontend/src/features/products/components/`.
- [x] Product backend field contract audited against requests, resources, service, model fillables, and old frontend multipart payload behavior.
- [x] Product form covers backend-supported image upload, rack location, sub-unit pricing, profit margin, variation images/sub-unit fields, combo variation selection, and custom fields.
- [x] Product form view simplified into an enterprise-style page form with fewer visible panels while keeping code split into maintainable components.
- [x] Product custom fields fixed to use the existing `product` module key, show required markers/errors, and preserve custom-field updates.
- [x] Product custom fields accept `null`/empty-array payloads and blank optional custom-field values are normalized to `null`.
- [x] Product form now shows a top validation alert when client-side validation blocks saving.
- [x] Product detail page added with row View action, product-name breadcrumbs, read-only product profile, variations, combo items, and custom fields.
- [x] Product detail view polished into a single-page read-only layout with one main surface, internal dividers, media summary, and responsive detail sections.
- [x] Product detail view now shows type-appropriate sections, custom-field labels, product barcode, and a wider variation table with variant images.
- [x] Catalog frontend rebuild slice is complete for the currently implemented API surface.

## Stabilization

- [x] Full backend suite re-verified after module foundation and super-admin module management with `php artisan test` passing 214 tests and 930 assertions.
- [x] Fixed product-filtered backend test failures by aligning tax tests with the real products schema and inventory lookup test with current branch-access rules.
- [x] Stabilized full backend test suite for branch access, stock count live edits/removal/completion corrections, serial movement validation, supplier branch setup, and admin branch-bypass behavior.
- [x] Full backend suite verified with `php artisan test` passing 149 tests and 564 assertions.
- [x] Full backend suite re-verified after Inventory Stock Levels and branch-scope fixture cleanup with `php artisan test` passing 155 tests and 620 assertions.
- [x] Frontend production build verified after Inventory Stock Levels with `npm run build`.
- [x] Accounting UI slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Accounting Payment Accounts and Fiscal Years slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.

## Accounting Frontend Rebuild

- [x] Chart of Accounts page, filters, summary cards, CRUD dialog, protected system-account behavior, API hooks, types, breadcrumbs, and translations are present.
- [x] Journal Entries page, filters, summary cards, detail dialog, reversal dialog, API hooks, types, breadcrumbs, and translations are present.
- [x] Manual Journal create page uses a dedicated page form with active postable account selection, dynamic lines, debit/credit balance totals, validation, and translated UI.
- [x] Payment Accounts page, filters, summary cards, CRUD dialog, transfer dialog, chart-account linking, API hooks, navigation, breadcrumbs, and translations are present.
- [x] Fiscal Years page, filters, summary cards, CRUD dialog, date validation, API hooks, navigation, breadcrumbs, and translations are present.
- [x] Exchange Rates page and backend CRUD added for USD/KHR rates, enforcing one default current rate while keeping historical rates.
- [x] Sale payment recording now supports USD and KHR tender amounts, stores the entered currency/amount and exchange rate used, and converts KHR to the USD accounting amount for journals and balances.
- [x] Accounting sidebar now exposes the currently live accounting backend surface: Journals, Chart of Accounts, Payment Accounts, Exchange Rates, and Fiscal Years.
- [x] Accounting date inputs now use the shared setting-aware `AppDatePicker`, and accounting money display/inputs now use the active business/settings currency instead of hardcoded USD.

## Sales Frontend Rebuild

- [x] Sales remaining-scope review completed and planning rules updated to require step-by-step, componentized feature delivery with thin route pages and focused Sales components.
- [x] Sale Returns frontend slice added with typed API/hooks/schema, record-return dialog from sale detail, focused return line table component, sale returns list/detail routes, sidebar/breadcrumb navigation, English/Khmer translations, and frontend type-check/lint/build verification.
- [x] Dedicated Quotations frontend slice added with typed API/hooks/schema, quotation list/detail/create routes, Sale form quotation mode, convert-to-sale dialog, quotation-specific cancel copy, sidebar/breadcrumb navigation, English/Khmer translations, and frontend type-check/lint/build verification.
- [x] Sale Returns list page header, filters, table loading, and empty state now use shared `PageHeader`/`PageToolbar`/`EntityTable` patterns with active filter chips; frontend type-check, lint, and build verified.
- [x] Sales API hooks, types, cancel/payment schemas, and action dialogs are present.
- [x] Sales list page with search, status/type, branch/warehouse/customer, date filters, setting-aware dates, currency-aware totals, pagination, navigation, and translations is present.
- [x] Sale detail page with summary cards, lifecycle actions, payment recording, overview, totals, item table, breadcrumbs, and translations is present.
- [x] Sales list/detail slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Sales list page header, filters, table loading, and empty state now use shared `PageHeader`/`PageToolbar`/`EntityTable` patterns with translated clear-filter controls and active filter chips; frontend type-check, lint, and build verified.
- [x] Sales create/edit page form, product/lot/serial lookup line entry, sale-level totals, create/edit/delete actions, breadcrumbs, API payloads, hooks, and translations are present.
- [x] Sales create/edit slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Quotations list page header, filters, table loading, and empty state now use shared `PageHeader`/`PageToolbar`/`EntityTable` patterns with active filter chips; frontend type-check, lint, and build verified.
- [x] Sales list header button alignment and inline advanced filter toggle now match the shared table page standard.
- [x] Sales create/edit form now derives the saved branch from the selected warehouse instead of asking users to choose the branch manually.
- [x] Sales create/edit backend-backed selects now use searchable autocomplete controls for warehouse, customer, price group, and tax rates.
- [x] Sales create/edit product selection no longer crashes when the field array row appears before watched item values are hydrated; frontend type-check and lint verified.
- [x] Sales create/edit item table inputs now use default-size form controls while preserving the full product detail column; frontend type-check and lint verified.
- [x] Sales create form now supports optional multi-line direct payments with live remaining and change-back calculation before completing and recording payment after save.
- [x] Sale detail page now uses one main card with divider-separated header, sale items table, and sale summary, removing the top summary-card row; frontend type-check and lint verified.
- [x] Sale payment recording now supports split payments with multiple table input lines, searchable payment account selection, backend multi-line posting, and focused Sales API/frontend verification.
- [x] Existing completed sale payments can now be corrected safely through reversal-and-recreate flow, sale edit shows payment correction actions, sale detail has a payment-history toggle, and focused Sales API/frontend type-check verification passed.
- [x] Sales edit actions now follow the backend sales.edit authorization/edit-lifetime policy so completed sales can be opened for customer corrections when allowed.
- [x] Sales edit save no longer requires entering a new direct-payment line when users only update the sale itself; direct-payment validation now runs only when Take payment now is enabled.
- [x] Full-screen POS route added outside the dashboard layout with warehouse/customer/date/price group/items/tax/discount/shipping/notes, sample-inspired product category/brand tile browsing, and direct split-payment checkout fields aligned to the Sales form contract; frontend type-check, lint, and build verified.
- [x] POS layout reshaped closer to Ultimate POS with left cart/right product tiles, checkout totals under item lines, bottom cashier action bar, and item discount/tax/notes moved into an edit-line dialog; frontend type-check, lint, and build verified.
- [x] POS summary discount, order tax, and shipping now edit through summary-row modal actions, and duplicate Recent Transactions action was removed from the top toolbar; frontend type-check, lint, and build verified.
- [x] POS footer payment shortcuts removed in favor of the payment section, a single Save action added, and available-stock text hidden from sell-line rows; frontend type-check, lint, and build verified.
- [x] POS duplicate suspend control removed, and the POS route now exposes shared layout settings while remaining outside the dashboard sidebar/topbar shell; frontend type-check, lint, and build verified.
- [x] POS top toolbar now includes a cash-register action that opens the register selection/open-session modal and saves the chosen register session with the sale; frontend type-check, lint, and build verified.
- [x] POS cash-register modal now supports creating a new active register and opening it with the starting amount/notes in one flow before attaching the session to the sale; frontend type-check, lint, and build verified.
- [x] Sale/POS save now sends inline payments through the sale create/update transaction, adds a client request id uniqueness guard against duplicate creates, and keeps frontend save buttons locked during submission; PHP syntax checks, frontend type-check, lint, and build verified.
- [x] Write-flow transaction audit tightened customer-group data/audit writes, auth account/audit writes, and transaction-aware file deletion so database rollback does not leave committed rows pointing at deleted files.
- [x] POS sales now edit through the full-screen POS form at `/pos/{id}/edit`, with list/detail edit actions routed by sale type and non-POS edit URLs redirecting away from the standard form when needed; frontend type-check, lint, and build verified.
- [x] POS route files moved to the direct `frontend/src/app/pos` App Router segment so `/pos/{id}/edit` is discovered by Next.js and no longer returns 404; frontend type-check, lint, and build verified.
- [x] POS edit payment records now render in the same payment-line layout as POS create, while keeping completed-payment corrections on the existing safe update flow; frontend type-check and lint verified.
- [x] POS payment correction modal polished with a POS-style amount summary and aligned payment fields, and POS edit saves now return to `/pos` with a POS-specific update message instead of the sale detail page; frontend type-check and lint verified.
- [x] POS edit payment handling now uses the same inline multi-line payment form as POS create with no modal, allowing existing completed payment lines to be edited and new lines to be added before Save; frontend type-check and lint verified.
- [x] POS edit payment lines can now be removed inline; completed payment deletion reverses the payment journal/transaction and marks the payment reversed instead of hard-deleting ledger history. PHP syntax checks and frontend type-check/lint verified; focused backend feature test was added but could not run locally because the PHP SQLite PDO driver is unavailable.
- [x] POS footer buttons now keep stable height and no-wrap labels, with horizontal overflow handling for narrow screens; frontend type-check and lint verified.
- [x] POS product line table now gives more room to product descriptions and less width to unit price while keeping fixed table sizing.
- [x] POS product line unit price input now right-aligns values to match the table header and total column alignment.
- [x] POS Recent Transactions now opens an in-page modal using the existing searchable table pattern, paginated POS-sale rows, and View/Edit actions.
- [x] POS product gallery now stays as the desktop side panel on large screens and opens from a mobile toolbar toggle drawer on small screens.
- [x] POS summary divider borders now explicitly use the soft theme divider color, and product gallery panels/tiles now match the clean paper background used by the cart section.
- [x] POS summary row and product gallery side divider now use explicit soft divider border styles so they do not render as bold black lines.
- [x] POS customer selector now has a permission-aware add button that opens the shared customer creation dialog and selects the new customer after saving.
- [x] POS customer add button now uses the active layout setting control height so it matches the customer field height across compact, small, normal, and large sizes.
- [x] POS now listens to the global layout settings for language synchronization and top navigation height/theme styling.
- [x] POS toolbar actions now stay pinned to the right edge of the top navigation.
- [x] POS product gallery now supports product search alongside category and brand filtering.
- [x] POS duplicate product adds now increase the existing sale line quantity for matching product/variation/unit/lot, while protecting duplicate serial lines.
- [x] POS product gallery tiles now use a square card shape with a larger flexible image area for clearer product photos.
- [x] Sale and POS form payment, total, rounding, and payload helpers are centralized in a shared sales form helper module; frontend type-check, lint, and build verified.
- [x] Sale/POS edit now sends sale changes, payment corrections, payment removals, and new payment lines through one backend update-with-payments endpoint for transaction-safe saves.
- [x] Sale edit-window day comparison now uses absolute day difference so expired sales are correctly blocked; focused Sales API suite passes.
- [x] POS product gallery UI is extracted into a dedicated component so the POS form page keeps sale workflow logic separate from product browsing; frontend type-check, lint, and build verified.
- [x] Sale/POS payment edit-change payload building now uses one shared helper, POS product gallery search is debounced, and sale detail hides Edit for clearly blocked return/cancel states; Sales API suite and frontend type-check/lint/build verified.
- [x] POS direct-payment table and payable summary are extracted into a dedicated component so the POS form page keeps payment rendering separate from sale workflow state; frontend type-check, lint, and build verified.
- [x] POS cart product picker, item table, quantity controls, and summary strip are extracted into a dedicated component while preserving the existing payment section nesting; frontend type-check, lint, and build verified.
- [x] POS warehouse/customer/date header fields are extracted into a dedicated component while preserving branch synchronization and the add-customer action; frontend type-check, lint, and build verified.
- [x] POS cart product line empty states now reuse compact `EmptyState` with the POS icon across desktop table and mobile card layouts, with the desktop empty table filling the available cart height; frontend type-check verified.
- [x] POS product gallery empty state now reuses the shared compact `EmptyState` component with the product icon, matching customer/product table empty-state styling.
- [x] POS cart and payment summary currency values now stack USD and KHR lines using `USD:`/`KHR:` labels instead of inline dual-currency text; frontend type-check verified.
- [x] POS cart and payment summary currency values now use larger value text for easier cashier scanning; frontend type-check verified.
- [x] POS cart and payment summary labels now use larger, bolder text to match the enlarged currency values; frontend type-check verified.
- [x] POS payment summary strip no longer shows the extra Direct Payment count/Add line tile, leaving only payable, entered, and remaining/change totals; frontend type-check verified.
- [x] POS summary currency lines now split currency labels and values into separate aligned columns for cleaner USD/KHR amount alignment; frontend type-check verified.
- [x] POS summary currency labels now stay left-aligned in a fixed label column while values remain right-aligned; frontend type-check verified.
- [x] POS Total Payable currency amount now renders larger than the other payment summary values for stronger cashier focus; frontend type-check verified.
- [x] POS edit-line dialog now supports tracked product assignment by scanning/searching the matching lot or serial, stores the selected lot/serial IDs for the sale payload, and locks serial lines to one unit; frontend local check verified.
- [x] Cash Register Management page added with branch/status filters, create/edit/delete actions, open/close session dialogs, recent sessions view, sidebar navigation, breadcrumbs, API hooks, types, and translations; frontend type-check, lint, and build verified.
- [x] Cash Register Management page header and filters now use shared `PageHeader`/`PageToolbar` with active branch/status filter chips; frontend type-check, lint, and build verified.

## Inventory Frontend Rebuild

- [x] Stock Levels read-only backend endpoint, frontend page, API hooks, types, filters, detail dialog, navigation, branch-scoped tests, and translations are present.
- [x] Stock Levels verified with focused backend tests, Inventory API tests, Inventory service tests, frontend type-check, and frontend lint.
- [x] Stock Adjustments page, create form, inventory API hooks, types, product lookup, filters, detail view, and translations are present.
- [x] Stock Adjustments edit support added with shared form reuse, adjustment update API, and duration-based backend edit-window enforcement.
- [x] Stock Adjustments frontend type-check and lint verified.
- [x] Stock Transfers list, dedicated create/edit pages, dedicated detail page, reusable product lookup, filters, delete/receive actions, API hooks, types, and translations are present.
- [x] Stock Transfer buttons follow the shared UI standard: filled create/save/receive, small icon-only page-header back actions, outlined form cancel, default form/dialog action sizing, small dense table actions, shared row actions, and confirmed receive from the detail page.
- [x] Stock Transfer form item lines use a bordered, horizontally scrollable, fixed-layout table consistent with the product variation matrix pattern.
- [x] Stock Counts list, dedicated create page, dedicated count workflow detail page, count entry/correction/delete/complete actions, API hooks, types, breadcrumbs, and translations are present.
- [x] Stock Counts frontend type-check and lint verified; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Stock Counts actual counted quantity entry simplified into one-screen inline table inputs on create and detail pages, removing the hidden correction-dialog workflow.
- [x] Stock Count backend service refactored to match inventory service/repository standards with item pagination in the repository and focused workflow helpers for locking, status checks, entries, corrections, deletion, completion, and audit payloads.
- [x] Stock Count backend refactor verified with focused stock count tests and the full inventory feature test directory.
- [x] Stock Count seeded items can now be explicitly marked as zero counted quantity and still post the expected completion correction.
- [x] Stock Count flow corrected so unique count items are auto-created from current warehouse stock, users record duplicate count entries per item, item counted totals are summed from entries, and the workspace shows ending balance beside counted totals.
- [x] Stock Count workspace now has a visible top count-entry strip for scanning/searching an item, seeing current counted total and ending balance, entering this pass quantity, and saving the entry.
- [x] Stock Count item table action column now opens a dedicated count-entry dialog for the selected unique item, with ending balance, counted total, difference, and this-entry quantity.
- [x] Stock Count list action can open an in-progress count directly into the count-entry flow, and the Next.js dynamic detail route uses the current async params contract.
- [x] Stock Count entry workflow split into a dedicated entry page with scan/search form and duplicate entry history, while the detail page is now a unique stock-count-item review page.
- [x] Stock Count entry page now puts the product picker above the entry row, shows selected product info beside count quantity, and refreshes the entry table immediately after recording.
- [x] Stock Count entry page now includes a live count item totals table and refreshes it after each recorded entry so counted totals update immediately.
- [x] Stock Count entry history rows can be edited while in progress, applying the quantity delta back to unique item counted totals, and the entry row clears its selected product after recording.
- [x] Stock Count detail page now uses separate summary, count-items, and entry-history cards, with the count entry history table available directly on the detail page.
- [x] Stock Transfer edit loading state now uses valid page-level markup instead of rendering a table row outside a table.
- [x] Stock Transfer detail page rebuilt into a more standard ERP read-only layout with header actions, transfer summary, warehouse movement, timeline metadata, and fixed transfer-line table.
- [x] Stock Transfer detail page simplified to match the Stock Count detail layout with a header, summary grid, and item table, removing the left-side section.
- [x] Stock Transfer detail item table now has a local search field like Stock Count detail for filtering transfer items by product, SKU, lot, serial, notes, quantity, or unit cost.
- [x] Stock Transfer detail item table now uses the Stock Count detail table pattern with local search, rows-per-page options, and pagination.
- [x] Stock Transfer detail content is split into separate summary and transfer-item cards for cleaner organization.
- [x] Inventory create/edit forms now use searchable backend-backed warehouse autocompletes for adjustments, transfers, and counts, and editable inventory item tables use default-size form controls; frontend type-check and lint verified.
- [x] Stock Lots page, API hooks, types, filters, paginated table, detail dialog, status update action, navigation, and translations are present.
- [x] Stock Serials page, API hooks, types, filters, paginated table, detail dialog, write-off action, navigation, and translations are present.
- [x] Inventory list/detail read-only dates now use the same setting-aware display format as the shared date picker.
- [x] System date display and shared date picker now follow the business `general.date_format` setting, with auth payload fallback for users without settings access.
- [x] Date month display uses abbreviated English month names and full Khmer month names while preserving the configured date order.
- [x] Date-format alignment verified with focused auth API test, frontend type-check, and frontend lint.

## Purchases Backend Foundation

- [x] Purchase document backend foundation added with purchases/purchase_items tables, models, policy, repository, service, requests, resources, `/api/v1/purchases` routes, branch access checks, generated PO numbers, line totals, and focused API tests.
- [x] Purchase receiving backend added with `/api/v1/purchases/{purchase}/receive`, receive validation, stock movement posting, received quantities, purchase status updates, lot creation, serial creation, receiver metadata, and focused API tests.
- [x] Purchase UoM handling now validates product-configured sub-units, blocks sub-unit buying for lot/serial tracked products, converts received sub-unit quantities into base inventory quantities, and posts base-unit receipt costs.
- [x] Purchase Return backend now preserves branch access on list/show/store, converts sub-unit return quantities to base inventory movements, validates selected serial returns, and exposes return item product/variation details.
- [x] Purchase Return backend now supports multiple return documents without writing unsupported purchase status values, and lot returns can use the remaining current lot quantity after prior returns; focused Purchase Return and Purchase API suites verified.
- [x] Purchase payments now respect net payable after completed purchase returns, preventing overpayment beyond `purchase total - completed returns`; focused Purchase and Purchase Return API suites verified.
- [ ] Purchase receipt and purchase return AP/inventory accounting lifecycle: post receipt as `DR Inventory Asset / CR Accounts Payable` and return as `DR Accounts Payable / CR Inventory Asset`; keep supplier credits/refunds as a separate future feature.
- [x] Purchase API focused tests verified after enabling the PHP SQLite driver.
- [x] Full backend suite re-verified after Purchase UoM, Purchase Return, and Expense accounting hardening with `php artisan test` passing 206 tests and 895 assertions.

## Purchases Frontend

- [x] Types (`Purchase`, `PurchaseFilters`, `PurchasePayload`, `ReceivePurchasePayload`, etc.) are defined in `frontend/src/types/purchase.ts`.
- [x] API transport layer (`purchasesApi`) with list, show, create, update, delete, receive methods is present.
- [x] React Query hooks (`usePurchasesQuery`, `usePurchaseQuery`, `useCreatePurchaseMutation`, `useUpdatePurchaseMutation`, `useDeletePurchaseMutation`, `useReceivePurchaseMutation`) are present.
- [x] Zod schemas (`purchaseSchema`, `purchaseItemSchema`, `receivePurchaseSchema`, `receivePurchaseItemSchema`) and form helpers (`emptyPurchaseValues`, `valuesFromPurchase`, `buildPurchasePayload`) are present.
- [x] Purchases list page with search, status/payment/branch/warehouse/supplier/date filters, paginated table, row actions (view/edit/delete), and delete confirmation is present.
- [x] Purchases list page header and filters now use shared `PageHeader`/`PageToolbar` with translated clear-filter controls and active filter chips; frontend type-check, lint, and build verified.
- [x] Purchases create/edit form with warehouse/supplier autocompletes, item line table, totals calculation, discount/shipping/notes fields, and status selection is present.
- [x] Purchases create/edit form now splits item lines, pricing totals, and notes into focused typed components under `frontend/src/features/purchases/components/`.
- [x] Purchases detail page with header info, items table, summary, notes, and action buttons (receive/edit/delete) is present.
- [x] Purchase detail summary now displays returned amount, net payable, and due amount from backend-calculated fields so payment limits after returns are visible to users; focused Purchase API test plus frontend type-check/lint/build verified.
- [x] Purchase receive dialog with per-item quantity/lot/serial entry is present.
- [x] Purchase return dialog now uses backend-provided valid lot and serial options for tracked purchase lines, with frontend validation before submit; focused Purchase/Purchase Return API tests plus frontend type-check/lint/build verified.
- [x] Purchase payment deletion now requires an explicit reversal reason in the frontend and backend, with the reason stored on the reversed payment audit trail; focused Purchase API test, frontend type-check, and frontend lint verified.
- [x] Purchase Returns list page header, filters, table loading, and empty state now use shared `PageHeader`/`PageToolbar`/`EntityTable` patterns with active branch/warehouse/date filter chips; frontend type-check, lint, and build verified.
- [x] Sidebar navigation (`/purchases`), breadcrumbs, and route pages (list, create, detail, edit) are registered.
- [x] English and Khmer translations are complete with namespace registered in i18n.
- [x] Frontend type-check, lint (0 new errors), and build verified.

## Expenses Frontend

- [x] Expenses generated frontend reviewed against Sales/Purchases patterns, shared API hooks, route wrappers, permissions, table states, dialogs, and translations.
- [x] Expense form dialog refactored from manual local state to the existing Zod schema plus React Hook Form pattern, with server field-error mapping.
- [x] Expense payment account selection now follows accounting requirements by showing active linked payment accounts only.
- [x] Expense list uses the supported edit dialog flow instead of routing the edit action to the detail page.
- [x] Expense list/detail dates now use the shared business date-format display helpers.
- [x] Expense detail loading, error, back action, edit, and delete controls now follow shared UI patterns.
- [x] English and Khmer Expenses translations updated for new form copy.
- [x] Expenses frontend type-check, lint, and build verified; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Expense backend accounting lifecycle now reverses and reposts journals/payment-account transactions on update, reverses them on delete, and rejects inactive or unlinked payment accounts.
- [x] Focused Purchase, Purchase Return, Expense, Unit, and Sales backend suites verified after enabling the PHP SQLite PDO driver.

## Reports

- [x] First Sales report slice added with module-gated `/api/v1/reports/sales`, typed frontend API/hooks, `/reports` page, filters, summary totals, paginated sales rows, sidebar/breadcrumb navigation, English/Khmer translations, branch-scoped backend coverage, frontend type-check/lint/build verification, and docs updated to mark Reports as partial rather than fully implemented.
- [x] Sales Return report slice added with module-gated `/api/v1/reports/sales-returns`, report selector on `/reports`, refund/status/branch/warehouse/customer/date filters, summary totals, paginated return rows, English/Khmer translations, branch-scoped backend coverage, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Purchases report slice added with module-gated `/api/v1/reports/purchases`, report selector on `/reports`, status/payment/branch/warehouse/supplier/date filters, summary totals, paginated purchase rows, English/Khmer translations, branch-scoped backend coverage, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Purchase Return report slice added with module-gated `/api/v1/reports/purchase-returns`, report selector on `/reports`, status/branch/warehouse/supplier/date filters, summary totals, paginated purchase return rows, English/Khmer translations, branch-scoped backend coverage, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Sale Payments report slice added with module-gated `/api/v1/reports/sale-payments`, report selector on `/reports`, status/method/branch/warehouse/customer/payment-account/cashier/date filters, collected-payment summary totals, paginated payment rows, English/Khmer translations, branch-scoped backend coverage through related sales, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Purchase Payments report slice added with module-gated `/api/v1/reports/purchase-payments`, report selector on `/reports`, status/method/branch/warehouse/supplier/payment-account/cashier/date filters, paid-out summary totals, paginated payment rows, English/Khmer translations, branch-scoped backend coverage through related purchases, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Stock report slice added with module-gated `/api/v1/reports/stock`, report selector on `/reports`, branch/warehouse/category/stock-mode filters, quantity summary totals, paginated stock rows, lot breakdown for lot-tracked stock, English/Khmer translations, branch-scoped backend coverage through warehouses, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Reports frontend structure cleaned up by extracting shared summary cards, report tables, and report configuration from `ReportsPage`, keeping the page shell easier to maintain as more reports are added; frontend type-check, lint, and build verified.
- [x] Reports summary cards polished with reusable icon badges, color-coded KPI styling, responsive grid wrapping, and frontend type-check/lint/build verification.
- [x] Reports page header and filters now use shared `PageHeader`/`PageToolbar` components with translated clear-filter controls and active filter chips; frontend type-check, lint, and build verified.
- [x] Expenses report slice added with module-gated `/api/v1/reports/expenses`, report selector on `/reports`, search/branch/expense-account/payment-account/cashier/payment-method/date filters, expense summary totals, paginated expense rows, English/Khmer translations, branch-scoped backend coverage, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.
- [x] Cash Register report slice added with module-gated `/api/v1/reports/cash-registers`, report selector on `/reports`, search/status/branch/cash-register/cashier/opened-date filters, session cash summary totals, paginated register-session rows, English/Khmer translations, branch-scoped backend coverage, Reports backend test coverage, frontend type-check/lint/build verification, and docs updated.

## Frontend UI Consistency

- [x] Frontend shared and page-level icons now use Solar icons through a single local icon module, including sidebar navigation and common actions.
- [x] Frontend layout density simplified through shared theme presets: smaller default layout size, reduced input/button/topbar/sidebar metrics, tighter dashboard shell spacing, and standardized shared MUI card/dialog/menu/icon-button sizing; frontend type-check, lint, and build verified.
- [x] Feature pages and forms audited for sizing inheritance; repeated page-level card/dialog spacing overrides were removed so standard list cards, form cards, and dialog footers inherit shared MUI theme sizing, while dense table/special POS sizing remains intentional; frontend type-check, lint, and build verified.
- [x] Glass surface theme corrected so blur is no longer applied globally to normal cards, papers, inputs, and date fields; blur is limited to shell/overlay chrome with a lighter filter, preventing glass mode from looking like a screen-cover blur; frontend type-check, lint, and build verified.
- [x] Dark sidebar glass mode corrected with a stronger dark surface and no backdrop blur so light app backgrounds no longer create a white haze over dark sidebar navigation; frontend type-check, lint, and build verified.
- [x] Glass surface theme fully removed from the shared theme, persisted UI settings, layout settings drawer, dashboard/POS shell styling, and translations; old saved glass values are discarded during UI-store migration; frontend type-check, lint, and build verified.
- [x] Light navbar/sidebar overrides now use dedicated light-shell text, muted, border, hover, and paper colors even when the main app is in dark mode, so forced-light shell surfaces keep correct contrast; frontend type-check, lint, and build verified.
- [x] Layout settings drawer now opens above the navbar/sidebar shell and scrolls its content inside the panel, preventing the topbar from blocking the settings popup; frontend type-check, lint, and build verified.
- [x] Sidebar navigation regrouped into clearer ERP sections for Overview, Sales, Purchasing, Contacts, Catalog, Inventory, Finance, Foundation, and System, with the missing Purchase Returns item translation fixed in English and matching new section labels added in Khmer; frontend type-check, lint, and build verified.
- [x] Inventory sidebar submenu flattened so warehouse-related routes appear at the same level as Warehouses and Rack Locations, with distinct icons for stock levels, lots, serials, transfers, adjustments, and cycle counts; frontend type-check, lint, and build verified.
- [x] Sidebar and topbar icons now derive their color from the active theme primary preset, including light/dark shell variants and themed hover backgrounds; frontend type-check, lint, and build verified.
- [x] Sidebar and top nav theme settings now expose three solid background color presets in addition to inherit, light, and dark, while icons, active states, borders, and button accents follow the main theme color only; dashboard and POS shells share the same color helper, with frontend type-check, lint, and build verified.
- [x] Emerald theme preset refreshed to a darker forest-green palette inspired by the provided reference image; frontend type-check, lint, and build verified.
- [x] App background now uses one continuous fixed primary-color gradient at the global body layer, with auth, dashboard, and POS shells kept transparent/translucent to avoid split background bands; frontend type-check, lint, and build verified.
- [x] Active sidebar menu items now use a filled primary theme color with contrast text/icons instead of a pale tint, making the selected route visibly stronger across theme presets; frontend type-check, lint, and build verified.
- [x] Sidebar Configuration section renamed from Foundation and now contains Custom Fields alongside Branches, Users, and Settings, while Catalog keeps product/tax/price setup only; frontend type-check, lint, and build verified.
- [x] Role and Permission management frontend added with `/roles` route, sidebar and breadcrumb navigation, typed API/hooks/schema, grouped permission create/edit dialog, protected-role handling, delete confirmation, pagination/search states, and English/Khmer translations; frontend type-check, lint, and build verified.
- [x] Super admin Business Management frontend added with `/businesses` route, super-admin-only sidebar navigation, typed API/hooks/schema, create/edit business dialog with owner-admin creation, filters, pagination, usage/status display, breadcrumbs, and English/Khmer translations; frontend type-check, lint, and build verified.
- [x] Tenant admin company profile editing added inside Settings > General using the existing `/api/v1/business` API, allowing safe business identity/contact/address updates while leaving plan/status/license limits read-only under super-admin control; PHP syntax check, frontend type-check, lint, and build verified.
- [x] Global table headers now left-align by default to match body cells while explicit centered action columns and right-aligned numeric columns keep their matching alignment, and Company Profile was moved from Settings > General into its own Settings tab; frontend type-check, lint, and build verified.
- [x] Company Profile business address now follows the shared customer/supplier Cambodia cascading address pattern while keeping address line 1 and line 2 as normal inputs; backend business update validation accepts village/commune/district/province-city address fields, and PHP syntax check plus frontend type-check/lint/build verified.
- [x] Sidebar menu visibility now uses per-item permission requirements from the live route/policy surface, hides inaccessible accounting children and empty sections, keeps Dashboard generally visible, and reserves super-admin-only business management for platform users; frontend type-check, lint, and build verified.
- [x] Cash Registers dashboard route page slimmed to a thin wrapper, with the feature implementation moved into `frontend/src/features/sales/CashRegistersPage.tsx`.
- [x] Sales and POS form default/value mapping deduplicated into shared Sales form helpers while preserving POS-specific form behavior; frontend type-check and lint verified.
- [x] API error display hardened so UI extracts backend messages reliably, avoids vague raw Network Error copy, keeps raw 500 exception internals hidden in production, and has focused exception-rendering test coverage.
- [x] Invoice print architecture fixed to use standard API template responses, authenticated Axios PDF blob download/preview, centralized invoice relationship loading, and focused invoice API test coverage.
- [x] Invoice/POS receipt printing now follows Laravel Blade HTML/CSS to browser `window.print()` flow, with POS sales labeled as receipts and frontend print verification passing.
- [x] Invoice/POS receipt printing now renders Blade HTML into an in-page browser frame before calling print, avoiding a separate browser tab; frontend type-check verified.
- [x] Invoice/POS receipt printing now uses the saved `invoice.invoice_layout` setting as the default layout, so users are not asked to choose a template every print; frontend type-check verified.
- [x] Sale detail printing now has a fast Print action that immediately uses the saved default layout, plus a separate Inv. Template action for one-off template override; frontend type-check verified.
- [x] Solar icon frontend change verified with `npm.cmd run type-check`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Shared theme now aligns default button and outlined input heights while preserving compact small controls for dense tables.
- [x] Layout settings now include persisted Small, Normal, and Large size options, with Normal matching the previous default theme density.
- [x] Small layout setting now globally applies dense table rows and compact table-cell padding across MUI tables; frontend type-check and lint verified.
- [x] Layout settings now include a Compact size smaller than Small and a persisted Corner Radius level applied through the shared MUI theme; frontend type-check, lint, and build verified.
- [x] Layout theme color presets were refreshed with a more modern premium palette and cleaner light/dark app backgrounds.
- [x] Layout theme color presets were refined into premium choices while preserving the existing Graphite preset.
- [x] Layout settings color presets now show visible premium swatches and translated preset names instead of unlabeled color dots.
- [x] Layout corner radius setting now uses a volume-style slider from 0px to 20px, with 0px applying no radius.
- [x] Layout settings drawer now uses Solar icon badges for each settings section.
- [x] Layout settings now include a persisted Solid/Glass surface style, with restrained glassmorphism applied through the shared theme, dashboard shell, and POS shell; frontend type-check, lint, and build verified.
- [x] Normal Sale edit payment section now uses the same inline direct-payment rows as create mode, with existing completed payments editable/removable in-place instead of opening the payment correction modal.
- [x] Sale detail page refactored into an invoice-style document layout with header actions, customer/location metadata, itemized lines, notes, totals, and collapsible payment history.
- [x] Sale detail invoice summary totals now display as one horizontal row with local scrolling instead of wrapping into multiple rows.
- [x] Sale detail invoice header metadata now uses label/value lines with bold underlined values and no item-count field.
- [x] Sale detail invoice header label/value columns now align consistently with left-aligned labels and secondary-color value underlines.
- [x] Sale detail invoice header value underlines now use dashed divider-color borders to match the summary strip.
- [x] Backend-backed table filters now use a shared searchable autocomplete pattern for branch, warehouse, customer, category parent, and role option filters.
- [x] Searchable autocomplete fields now inherit the same theme-level height standard as normal select and text fields.
- [x] Date picker fields now inherit the same theme-level height standard as normal input, select, and searchable autocomplete fields.
- [x] Shared form field labels, placeholders, select values, autocomplete text, and date-picker text are vertically centered across layout size settings; frontend type-check, lint, and build verified.
- [x] Frontend local verification now uses cached ESLint through `npm run lint` and a faster `npm run check:local` script for lint plus type-check, keeping full `npm run build` for final production verification.
- [x] Product variation and combo table inputs now use the shared default-height, full-width product form controls.
- [x] Shared MUI table rows now use a global striped body-row style so standard system tables inherit consistent alternating row backgrounds without page-level duplication.
- [x] Brand uploaded image previews now resolve Laravel `/storage` asset URLs through the configured API host so images show correctly in the Next frontend.
- [x] Product detail, variation thumbnails, and POS product tiles now resolve Laravel `/storage` asset URLs through the configured API host.
- [x] POS checkout now hides sale/due date fields, moves price group and notes behind a More toggle, and keeps payment anchored at the bottom of the sell-line panel.
- [x] POS checkout layout reviewed and cleaned for desktop and iPad: product gallery now uses a drawer until wide desktop, cart table is narrower for landscape iPad/desktop, and portrait tablet/mobile uses compact cart cards; frontend type-check, lint, and build verified.
- [x] POS tracked item edit flow reviewed and cleaned: serial quantity locking is shared between cart layouts, tracking state is preserved when applying lot/serial lookup, and fast frontend check passes.
- [x] Pending frosted shell/global overlay blur changes reviewed and removed to preserve the verified solid/translucent layout behavior; Next route types regenerated and frontend type-check, lint, and build verified.
- [x] Agent rules now require small reusable shared components/hooks for repeated frontend patterns instead of duplicated page-level code.
- [x] Customer edit now shows a visible validation message when the form blocks saving.
- [x] Customer edit validation now accepts cleared nullable fields and names the first invalid field when save is blocked.
- [x] Customer edit now normalizes empty/null custom fields to an object so customers without custom fields can save.
- [x] Customer and supplier forms now share a reusable Cambodia cascading address component ordered Country, Province/City, District, Commune, Village.
- [x] Cambodia address data now syncs from the external source into local DB, and customer/supplier address fields read local master data with a Settings sync action.

## Foundation Frontend And API

- [x] Module registry foundation added with `config/modules.php`, `business_modules`, `ModuleService`, `module:<key>` middleware, auth `enabled_modules`, module-aware sidebar visibility, focused module-access tests, frontend type-check/lint/build verification, and docs updates.
- [x] Modular restructure plan and build checklist added under `Docs/v11-split/04-roadmap/`, with the split index updated for step-by-step tracking.
- [x] Super-admin module management added to Business Management with module state API, validation, resources, audit logging, enable/disable/trial/expire UI, limits/settings JSON editor, English/Khmer translations, focused backend tests, and frontend type-check/lint/build verification.
- [x] POS sale-with-payments save now uses a POST compatibility endpoint while preserving the existing PUT API route, avoiding production Docker/Nginx stacks that mishandle PUT payment updates; focused Sales API tests and frontend type-check verified.
- [x] Customer update now correctly clears nullable fields such as contact details, customer group, date of birth, address, and notes.
- [x] Cambodia address lookup API proxy added with cached provinces, districts, communes, and villages from Pumi.
- [x] Supplier update now correctly clears nullable contact and address fields.

## Edit Window Policy

- [x] Shared edit-window service added with per-feature lifetime-day settings pattern.
- [x] Sales edit lifetime refactored to use the shared edit-window service.
- [x] Sale edit authorization now depends on `sales.edit`, branch access, and the sale edit lifetime setting instead of sale status; completed-sale edits preserve status and repost inventory/accounting.
- [x] Stock adjustment, transfer, and count edit lifetime settings added; transfer and count edit endpoints enforce the shared window.

## Authorization And Branch Scope

- [x] Admin branch bypass removed; tenant admins now require assigned branches like other tenant users.
- [x] User management allows admin branch assignments instead of clearing or rejecting them.
- [x] Cash register and journal role shortcuts replaced with permission-based checks.

## Important Reminders

- `AGENTS.md` was shortened to main points only and now references the actual `Docs/v11-split/00-INDEX.md` filename.
- Before code changes, read `Docs/v11-split/ERP_Master_Build_Plan_v10.md` and `Docs/v11-split/ERP_Master_Build_Plan_v11.md`.
- New frontend user-facing text must be translated in both English and Khmer. Do not leave Khmer files with English placeholders.
- Reuse existing frontend patterns for pages, forms, API hooks, schemas, table states, dialogs, and toasts.
- Large forms or controls, especially Products, should use dedicated pages rather than modal dialogs.
- Product forms should use a clean enterprise page layout from current project patterns and product workflow needs, not copy the old frontend layout one-to-one.
- Before building or changing a UI control, check existing components and feature patterns first, then reuse the closest pattern when it fits.
- For form changes, mark required fields visibly and add/update focused tests for the validation contract when a test setup exists.
