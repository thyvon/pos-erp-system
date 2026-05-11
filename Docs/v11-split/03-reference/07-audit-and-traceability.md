## SECTION 7 - AUDIT AND TRACEABILITY

### 7.1 Current Audit Reality

`AuditService` exists and is actively used by implemented modules. It currently:

- writes directly to `audit_logs`
- catches exceptions and reports them
- sanitizes sensitive payload keys
- resolves tenant and branch context when possible

### 7.2 Important Current Audit Coverage

Observed audit coverage includes:

- login
- login_failed
- logout
- password_changed
- password_reset
- user lifecycle events
- payment account transfer
- inventory write-off
- sale creation and other sales lifecycle events

### 7.3 Planned Improvement

The older plan expected queue-dispatched audit writes. That is still a valid future improvement, but it is **not current reality**. Until it is implemented:

- document audit as synchronous-but-guarded
- do not claim `AuditLogJob` is active

---

