# ADR-004: Server-Side Branch Isolation

## Status
Accepted (v1.0.0)

## Context
Bakery OS supports multiple physical branches. During early prototyping, the active branch ID was passed from the client via headers (`x-branch-id`), and the backend inherently trusted this value to filter queries. This presented a severe security risk where any user could intercept the request and modify the header to access data from other branches.

## Decision
We enforce **Strict Server-Side Branch Isolation**.
- The `x-branch-id` header was completely removed from the frontend.
- The `withApiHandler` middleware now exclusively relies on the authenticated `session.user.branchId`.
- Every single Prisma query dynamically injects `where: { branchId: user.branchId }` for any role that is scoped to `B` (Branch-level) in the RBAC matrix.

## Consequences
- **Positive**: Impossible for malicious or curious employees to view sales, customers, or inventory from branches they do not belong to.
- **Positive**: Simplifies frontend logic, as the client no longer needs to manage or transmit branch state for authentication.
- **Negative**: SuperAdmins who legitimately need to view cross-branch data must use distinct reporting endpoints or explicitly switch their contextual session state.
