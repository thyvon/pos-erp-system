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
- [x] Accounting sidebar now exposes the currently live accounting backend surface: Journals, Chart of Accounts, Payment Accounts, and Fiscal Years.
- [x] Accounting date inputs now use the shared setting-aware `AppDatePicker`, and accounting money display/inputs now use the active business/settings currency instead of hardcoded USD.

## Sales Frontend Rebuild

- [x] Sales API hooks, types, cancel/payment schemas, and action dialogs are present.
- [x] Sales list page with search, status/type, branch/warehouse/customer, date filters, setting-aware dates, currency-aware totals, pagination, navigation, and translations is present.
- [x] Sale detail page with summary cards, lifecycle actions, payment recording, overview, totals, item table, breadcrumbs, and translations is present.
- [x] Sales list/detail slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Sales create/edit page form, product/lot/serial lookup line entry, sale-level totals, create/edit/delete actions, breadcrumbs, API payloads, hooks, and translations are present.
- [x] Sales create/edit slice verified with `npm run type-check`, `npm run lint`, and `npm run build`; lint still reports only the existing anonymous-default-export translation warnings.
- [x] Sales list header button alignment and inline advanced filter toggle now match the shared table page standard.
- [x] Sales create/edit form now derives the saved branch from the selected warehouse instead of asking users to choose the branch manually.
- [x] Sales create/edit backend-backed selects now use searchable autocomplete controls for warehouse, customer, price group, and tax rates.

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
- [x] Stock Lots page, API hooks, types, filters, paginated table, detail dialog, status update action, navigation, and translations are present.
- [x] Stock Serials page, API hooks, types, filters, paginated table, detail dialog, write-off action, navigation, and translations are present.
- [x] Inventory list/detail read-only dates now use the same setting-aware display format as the shared date picker.
- [x] System date display and shared date picker now follow the business `general.date_format` setting, with auth payload fallback for users without settings access.
- [x] Date month display uses abbreviated English month names and full Khmer month names while preserving the configured date order.
- [x] Date-format alignment verified with focused auth API test, frontend type-check, and frontend lint.

## Frontend UI Consistency

- [x] Frontend shared and page-level icons now use Solar icons through a single local icon module, including sidebar navigation and common actions.
- [x] Solar icon frontend change verified with `npm.cmd run type-check`, `npm.cmd run lint`, and `npm.cmd run build`.
- [x] Shared theme now aligns default button and outlined input heights while preserving compact small controls for dense tables.
- [x] Layout settings now include persisted Small, Normal, and Large size options, with Normal matching the previous default theme density.
- [x] Layout settings drawer now uses Solar icon badges for each settings section.
- [x] Backend-backed table filters now use a shared searchable autocomplete pattern for branch, warehouse, customer, category parent, and role option filters.
- [x] Searchable autocomplete fields now inherit the same theme-level height standard as normal select and text fields.
- [x] Date picker fields now inherit the same theme-level height standard as normal input, select, and searchable autocomplete fields.
- [x] Agent rules now require small reusable shared components/hooks for repeated frontend patterns instead of duplicated page-level code.
- [x] Customer edit now shows a visible validation message when the form blocks saving.
- [x] Customer edit validation now accepts cleared nullable fields and names the first invalid field when save is blocked.
- [x] Customer edit now normalizes empty/null custom fields to an object so customers without custom fields can save.

## Foundation Frontend And API

- [x] Customer update now correctly clears nullable fields such as contact details, customer group, date of birth, address, and notes.

## Edit Window Policy

- [x] Shared edit-window service added with per-feature lifetime-day settings pattern.
- [x] Sales edit lifetime refactored to use the shared edit-window service.
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
