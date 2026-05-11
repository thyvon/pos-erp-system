## SECTION 12 - ABSOLUTE RULES FOR v11

1. Codebase truth beats older plan text.
2. Do not mark a module as implemented unless routes, controllers, services, frontend pages, and supporting persistence all exist.
3. New features must follow the existing route -> request -> service -> resource pattern.
4. Controllers must authorize before calling services.
5. Tenant isolation is non-negotiable.
6. Branch scope rules must match the current middleware and policy behavior exactly.
7. Services may contain safety checks, but policies remain the primary authorization contract.
8. Audit writes must never leak passwords, tokens, or secrets.
9. Frontend pages must use stores and shared API wrappers, not ad hoc HTTP calls.
10. Translation keys for `en` and `km` must be updated in the same task as UI changes.
11. Tests are part of feature completion.
12. Stabilize live modules before expanding deep into planned modules.

---

