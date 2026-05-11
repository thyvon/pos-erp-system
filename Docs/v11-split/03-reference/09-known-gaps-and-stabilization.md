## SECTION 9 - KNOWN GAPS AND STABILIZATION TARGETS

### 9.1 Test Snapshot

Local `php artisan test` was run on **2026-05-11**.

Observed PHPUnit summary before the shell timeout:

- 122 passing tests
- 23 failing tests

### 9.2 Main Failure Themes

The failures indicate real stabilization work still needed in the current implementation:

- some older tests do not yet match newer branch-scope rules
- some catalog/contact tests assume permissions or branch behavior that changed
- stock count edit/remove/delta workflows still need correction
- a serial movement invariant test is failing
- a few tests create duplicate temporary tables inside the test itself

### 9.3 What This Means for Planning

The next phase should be **stabilize the current live modules**, not immediately start new large modules.

---

