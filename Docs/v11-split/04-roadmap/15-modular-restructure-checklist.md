# Modular Restructure Checklist

Use this checklist to track the modular platform restructure. Check items only after code, tests, docs, and verification are complete.

## Phase 1 - Module Foundation

- [x] Create backend module definitions in `config/modules.php`.
- [x] Create `business_modules` table.
- [x] Create `BusinessModule` model.
- [x] Create `ModuleService`.
- [x] Create `module:<key>` middleware.
- [x] Register middleware alias.
- [x] Seed default-enabled modules for new businesses.
- [x] Backfill default-enabled modules for existing businesses in migration.
- [x] Add `enabled_modules` to auth user payload.
- [x] Add frontend module registry.
- [x] Add frontend auth-store module check.
- [x] Make sidebar require module enablement and permission.
- [x] Guard current sellable route groups with module middleware.
- [x] Add focused backend module-access tests.
- [x] Run focused auth tests.
- [x] Run frontend type-check.
- [x] Run frontend lint.
- [x] Run frontend build.
- [x] Update project docs and checklist.

## Phase 2 - Admin Module Management

- [x] Create module management routes for super admin.
- [x] Create module management controller.
- [x] Create store/update Form Requests.
- [x] Create module state API Resource.
- [x] Add service methods to enable, disable, trial, expire, and update limits.
- [x] Add audit events for module changes.
- [x] Add backend tests for super-admin-only module management.
- [x] Add backend tests for tenant isolation.
- [x] Add Business Management frontend module management action/dialog.
- [x] Add enable/disable/trial/expire UI actions.
- [x] Add module limit/settings editor.
- [x] Add English translations.
- [x] Add Khmer translations.
- [x] Run focused backend tests.
- [x] Run frontend type-check/lint/build.

## Phase 3 - HRM Standalone Module

- [ ] Create `Modules/HRM/module.json`.
- [ ] Create HRM route file.
- [ ] Register HRM routes behind `module:hrm`.
- [ ] Add HRM permissions to seeder.
- [ ] Add HRM module metadata to frontend registry.
- [ ] Add HRM sidebar section hidden unless `hrm` is enabled.
- [ ] Create departments migration/model/controller/request/resource/service/policy/tests.
- [ ] Create job positions migration/model/controller/request/resource/service/policy/tests.
- [ ] Create employees migration/model/controller/request/resource/service/policy/tests.
- [ ] Create employee documents storage flow.
- [ ] Create employment contracts foundation.
- [ ] Create leave types foundation.
- [ ] Create leave requests foundation.
- [ ] Create attendance foundation.
- [ ] Create payroll draft foundation.
- [ ] Build HRM departments frontend.
- [ ] Build HRM positions frontend.
- [ ] Build HRM employee list/detail/create/edit frontend.
- [ ] Build HRM leave frontend.
- [ ] Add HRM English translations.
- [ ] Add HRM Khmer translations.
- [ ] Test HRM-only tenant access.
- [ ] Test HRM disabled access is blocked.
- [ ] Run backend HRM tests.
- [ ] Run frontend type-check/lint/build.

## Phase 4 - Optional Integrations

- [ ] Define module integration event pattern.
- [ ] Add HRM payroll approved event.
- [ ] Add accounting listener guarded by `accounting` module enablement.
- [ ] Add integration service for payroll journal posting.
- [ ] Test payroll approval without accounting enabled.
- [ ] Test payroll approval with accounting enabled.
- [ ] Document optional integration rules.

## Phase 5 - Reports and Dashboard Modularization

- [ ] Create backend report registry.
- [ ] Create frontend report registry.
- [ ] Create dashboard widget registry.
- [ ] Make reports module-aware.
- [ ] Make dashboard widgets module-aware.
- [ ] Add HRM report placeholders only after HRM data exists.
- [ ] Test HR-only tenant report/dashboard visibility.
- [ ] Test ERP tenant report/dashboard visibility.

## Phase 6 - Existing Module Migration

### Expenses

- [ ] Move backend Expenses files into module structure.
- [ ] Move frontend Expenses files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused Expenses tests.
- [ ] Run frontend verification.

### Purchases

- [ ] Move backend Purchases files into module structure.
- [ ] Move frontend Purchases files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused Purchases tests.
- [ ] Run frontend verification.

### Sales

- [ ] Move backend Sales files into module structure.
- [ ] Move frontend Sales/POS files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused Sales tests.
- [ ] Run frontend verification.

### Inventory

- [ ] Move backend Inventory files into module structure.
- [ ] Move frontend Inventory files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused Inventory tests.
- [ ] Run frontend verification.

### Accounting

- [ ] Move backend Accounting files into module structure.
- [ ] Move frontend Accounting files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused Accounting tests.
- [ ] Run frontend verification.

### Catalog and Contacts

- [ ] Move backend Catalog files into module structure.
- [ ] Move frontend Catalog files into module structure.
- [ ] Move backend Contacts files into module structure.
- [ ] Move frontend Contacts files into module structure.
- [ ] Keep API URLs stable.
- [ ] Run focused tests and frontend verification.

## Phase 7 - Package Model

- [ ] Define package config or database table.
- [ ] Map packages to modules.
- [ ] Add module limits per package.
- [ ] Provision modules when creating a business.
- [ ] Enforce employee limit for HRM.
- [ ] Enforce branch/user limits where applicable.
- [ ] Add tests for package provisioning.
- [ ] Add tests for limit enforcement.

## Phase 8 - Final Cleanup

- [ ] Move shared platform services into stable core namespace.
- [ ] Remove duplicate module helpers.
- [ ] Update all docs to platform + modules terminology.
- [ ] Add module template for future modules.
- [ ] Add CI coverage for module access tests.
- [ ] Confirm full backend suite passes.
- [ ] Confirm frontend type-check/lint/build passes.
