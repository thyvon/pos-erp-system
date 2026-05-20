## SECTION 11 - ORGANIZED ROADMAP FROM THE CURRENT BASELINE

### Phase 1 - Stabilize Current Implemented Modules

This phase has been completed for the previously known failures and should remain the first stop whenever regressions appear.

- keep branch-scope-related tests passing
- keep stock count edit/remove/completion delta behavior covered
- keep serial quantity invariant behavior covered
- align older tests with current branch-access rules where the code is correct
- avoid test-only schema collisions

### Phase 2 - Close Architectural Gaps in Live Modules

- decide whether to introduce queued audit writes
- decide whether repositories should gain shared caching behavior
- standardize audit event naming across inventory and sales services
- review policies for consistency with route middleware
- review current frontend views for direct logic duplication

### Phase 3 - Finish the Commercial Core

Recommended next business modules after stabilization:

1. Purchases
2. Expenses and broader payment flows
3. Reports
4. Dashboard enrichment

This order is practical because purchases complete the stock lifecycle, and reports should come after both sales and purchases are stable.

### Phase 4 - Add Growth Modules

After core ERP operations are stable:

- loyalty
- commissions and targets
- CRM
- gift cards
- installments

### Phase 5 - Add Advanced Operational Modules

Only after the commercial core is stable:

- manufacturing
- asset management
- HRM
- notifications and scheduled automation

---
