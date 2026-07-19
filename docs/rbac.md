# Role-Based Access Control (RBAC) Architecture

This document defines the RBAC policies, capability matrix, and security constraints for the Gopal Cake Shop ERP. For the detailed permissions matrix, see [rbac_matrix.md](file:///d:/Gopal%20Cake%20Shop/docs/rbac_matrix.md).

## 1. Separation of Authentication vs Authorization
- **Authentication (Who are you?):** Handled strictly by Supabase Auth (JWTs, session management).
- **Authorization (What may you do?):** Handled strictly by our custom RBAC implementation in Prisma.

## 2. Principle of Least Privilege
- Every new user account is created with NO permissions until explicitly assigned.
- The `ADMIN` role is never assigned by default.

## 3. The Authorization Architecture
The system evaluates authorization based on specific *Permissions* (Capabilities) rather than hardcoding `role === "ADMIN"`.

**Hierarchy:**
`Role` → `Default Permission Set` → `Effective Permissions` → `Capability Check`

This ensures that in the future, if we want to grant one extra permission to a single manager without changing their role, the architecture supports it.

### 3.1 Scoped Permissions (Branch Restrictions)
Permissions must carry execution context. 
- **Global Scope:** Capable of executing actions system-wide (e.g., an Admin viewing all orders).
- **Branch Scope:** Capable of executing actions ONLY within the user's assigned `branchId` (e.g., a Manager editing orders only at their branch).

**Fail-Safe Branch Rule:**
- **No branch assigned = No access.** If a user has a branch-scoped permission but no `branchId` is assigned to their profile, they receive no access. Fail closed, never fail open.

**Authorization Check Pattern:**
- `can(PERMISSIONS.UPDATE_ORDER_FULL, { branchId: order.branchId })` 
instead of `if (role === "ADMIN")`

## 4. User Lifecycle (Account Status)
Users do not use a simple boolean `isActive`. The lifecycle uses a strict status state machine:
- `INVITED`: Account created by Admin, waiting for user to set password.
- `ACTIVE`: Normal operating status.
- `SUSPENDED`: Administrator action. User cannot login. Requires administrator intervention to resolve.
- `DEACTIVATED`: Employee left company. Account retained to preserve historical logs/orders, but permanently cannot login until reactivated.
- `LOCKED`: Automatically generated due to too many failed login attempts. Temporary lock.

## 5. Protected Critical Actions
The system strictly prohibits the following actions at the API level:
- Deleting yourself.
- Deactivating or suspending yourself.
- Removing your own `ADMIN` role.
- Deactivating the **last user with the `manage_users` capability** (regardless of whether they are called ADMIN or OWNER).

## 6. Security Constraints

### Permanent Rule: Server-Side Enforcement
**RBAC is evaluated exclusively on the server.** Client-side permission checks exist only to improve user experience by hiding or disabling unavailable actions and must never be relied upon for security enforcement. Any manual API call without the required permission will return `403 Forbidden`.

### Immutable Creator
Fields such as `createdAt` and `createdBy` (where applicable) are strictly read-only forever. They cannot be updated via the API.

### Soft Delete Only
Users are never hard-deleted from the database to preserve historical audit logs and order relations.

### User Creation Flow (Invite-Based)
Admins DO NOT create passwords for users.
`Admin creates Invite` → `System emails Invite Link` → `User sets Password` → `Account ACTIVE`.

### Password Policy
- User API endpoints (`/api/users`) **never** expose password hashes.
- Changing passwords must use dedicated endpoints handled by Supabase.
- Passwords cannot be edited directly inside the generic `UserForm`.

### Route & Session Protection
- **Session Revocation Sequence:**
  1. Permission updated (e.g., role downgraded).
  2. Commit database transaction.
  3. Invalidate existing sessions using the supported Supabase administrative session revocation mechanism.
  4. Write audit log.
  5. Return success to the client.
- **Route Protection:** Next.js Server Components and Middleware will enforce route-level protection (Protect: `Page` → `Layout` → `API` → `Service`), ensuring unauthorized users cannot even load the page shells for restricted modules.
- **Permission Constants:** Use constants (e.g., `PERMISSIONS.MANAGE_USERS`) instead of magic strings to prevent typos and aid refactoring.

## 7. Audit Logging for Users
RBAC actions require mandatory, immutable audit logs with deep context.
Instead of just "Permission changed", logs must contain:
- **Who changed** (Actor ID/Email)
- **Whose account** (Subject ID/Email)
- **Old Role & New Role**
- **Old Permissions & New Permissions**
- **Timestamp**
- **Reason / Context**
- **IP / Device** (Optional for future)

**Required Audit Events:**
- Login (Success & Failure)
- Logout
- Password reset
- Permission/Role change
- Account status transitions (e.g. SUSPENDED)
- MFA changes (Future)
