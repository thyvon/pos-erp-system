## SECTION 10 - AI AGENT DELIVERY WORKFLOW

When an AI agent works in this repository, follow this order:

1. Read the relevant route file
2. Read the controller, Form Request, service, repository, resource, and policy for that feature
3. Check the frontend API file, store, router entry, sidebar entry, and page/component usage
4. Check existing tests for that module before changing behavior
5. Implement backend and frontend changes together when the feature spans both
6. Add or update tests in the same task
7. Update this plan if system behavior changed

Work in small slices:

- finish one user-visible workflow before starting the next
- explain the implementation plan before editing files
- keep each slice aligned with the current backend contract instead of planning-only features
- update `Project Check List.md` after each completed slice

Required implementation standards:

- use Form Requests for validation
- use API Resources for output
- keep controllers thin
- keep business logic in services
- keep frontend HTTP calls in `frontend/src/api`
- keep page views driven by feature hooks, shared API wrappers, React Query, and Zustand stores where appropriate
- keep route pages thin and move feature UI into typed components under `frontend/src/features/*`
- split large feature files into focused pieces such as list table, filters, detail summary, form sections, action dialogs, and payment/return line tables
- keep schemas, payload builders, calculations, and mapping helpers outside page components when they are reused or non-trivial
- prefer extending an existing shared component or hook before adding another page-local copy of the same table, filter, dialog, or form pattern
- add `en` and `km` translation keys in the same task

Forbidden assumptions:

- do not assume future modules already exist because permissions exist
- do not assume Redis caching exists in repositories
- do not assume audit is queued
- do not assume HRM is implemented because the module folder exists

---
