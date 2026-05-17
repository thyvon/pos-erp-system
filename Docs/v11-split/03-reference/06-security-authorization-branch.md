## SECTION 6 - SECURITY, AUTHORIZATION, AND BRANCH SCOPE

### 6.1 Roles Currently Used in Code

- `super_admin`
- `admin`
- `manager`
- `cashier`
- `accountant`
- `inventory_manager`
- `sales_representative`

### 6.2 Permission Reality

The permission seeder includes permissions for both implemented and future modules. That means:

- permissions are not proof of implementation
- UI navigation and docs must only expose modules that actually exist
- future modules may keep reserved permission names for compatibility

### 6.3 Branch Scope Rules

Current branch behavior must be documented exactly:

- `super_admin`: platform administration bypass
- tenant roles, including `admin` and `accountant`: branch access comes from assigned branches
- tenant users must have at least one assigned branch to use tenant API routes

### 6.4 Policy Expectations

For implemented modules:

- every controller action should authorize before service execution
- policies should enforce same-business checks
- branch-scoped records should also enforce `hasBranchAccess(record.branch_id)` where relevant

### 6.5 Sensitive Data Rules

- passwords and tokens must never be returned accidentally
- audit payloads must sanitize password/token-like keys
- all API failures must stay JSON-shaped for API routes

---
