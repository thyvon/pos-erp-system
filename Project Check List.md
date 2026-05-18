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

## Inventory Frontend Rebuild

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

## Frontend UI Consistency

- [x] Frontend shared and page-level icons now use Solar icons through a single local icon module, including sidebar navigation and common actions.
- [x] Solar icon frontend change verified with `npm.cmd run type-check`, `npm.cmd run lint`, and `npm.cmd run build`.

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
