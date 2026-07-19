# Architecture Validation Report
## Gopal Cake Shop ERP — v1.0

> **Purpose**: Maps every frozen architectural decision to its concrete implementation and verification evidence.
> This is not design documentation. It is proof that the architecture was built and tested as specified.

Last Updated: 2026-07-10

---

## How to Read This Document

Each section follows the format:

- **Decision** — The frozen architectural rule
- **Implementation** — Where it lives in the codebase
- **Evidence** — The tests that prove it works correctly

A decision is considered **verified** only when all three exist.

---

## 1. Transactional Outbox Pattern

**Decision**: Domain Events must never be published by direct network call inside a DB transaction. Instead, they must be written as a row in the `Outbox` table within the same transaction. A background processor publishes them after commit.

> "Domain Event publishing must never block the originating transaction."

| Layer | File |
|---|---|
| Schema | [schema.prisma](file:///d:/Gopal%20Cake%20Shop/prisma/schema.prisma) → `model Outbox` |
| Implementation | [OutboxEventBus.ts](file:///d:/Gopal%20Cake%20Shop/src/services/event-bus/OutboxEventBus.ts) → `publishTransactionally(tx, ...)` |
| POS integration | [OrderService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderService.ts) → `checkoutPosOrder` |
| Checkout integration | [checkout/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/public/checkout/route.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Outbox row created on commit | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | `tx.outbox.create` called with correct schema |
| Global `prisma.outbox.create` never called | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | No cross-transaction leakage |
| POS checkout writes Outbox in transaction | [pos.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/pos.test.ts) | `txMocks.outbox.create` asserted |
| `eventId` format (`evt_*`), `occurredAt`, `published: false` defaults | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | Schema integrity verified |
| Background publisher marks `published: true` | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | Processor lifecycle proven |
| Retry: `retryCount` incremented on failure | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | Failure handling verified |

**Status: ✅ Verified**

---

## 2. RBAC — Role-Based Access Control

**Decision**: Every authenticated endpoint must enforce role-based permissions. `withApiHandler` resolves the role from Supabase session + Prisma user sync, then evaluates `hasPermission(appRole, branchId, capability)` from the frozen permission matrix.

| Layer | File |
|---|---|
| Permission matrix | [permissions.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/rbac/permissions.ts) |
| Enforcement | [withApiHandler.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/withApiHandler.ts) → lines 94–105 |
| Role × Permission matrix | [RolePermissionMatrix.ts](file:///d:/Gopal%20Cake%20Shop/tests/matrices/RolePermissionMatrix.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Data-driven RBAC Matrix (5 role × branch combinations) | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Role guards enforced |
| CHEF denied settings read → 403 | [settings.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/settings.test.ts) | Non-privileged role blocked |
| DRIVER denied `MANAGE_INVENTORY` → 403 | [inventory.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/inventory.test.ts) | Capability gate enforced |
| Driver cannot submit an order → 403 | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Action-level role boundary |
| Suspended account blocked → 403 | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Account lifecycle enforced |

**Status: ✅ Verified**

---

## 3. Branch Isolation

**Decision**: All staff-facing data queries must be scoped to `branchId`. Non-admin users must never read or mutate data belonging to another branch.

| Layer | File |
|---|---|
| Isolation utility | [prisma-extension.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/prisma-extension.ts) → `getIsolatedPrisma` |
| Enforcement | [OrderService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderService.ts), [OrderTransitionService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderTransitionService.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Manager accessing own branch → 200 | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Correct branch allowed |
| Manager accessing other branch → 403 | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Cross-branch blocked |
| Chef cross-branch transition → 404 | [chef.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/chef.test.ts) | Order invisible across branches |
| Reporting: non-admin branch param overridden | [reporting.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/reporting.test.ts) | RBAC forces own branch |

**Status: ✅ Verified**

---

## 4. Optimistic Concurrency

**Decision**: Concurrent writes to the same order must be detected and rejected with `409 Conflict`.

| Layer | File |
|---|---|
| Error mapping | [withApiHandler.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/withApiHandler.ts) → `CONCURRENCY_ERROR` → 409 |

| Evidence | File | What it proves |
|---|---|---|
| PATCH order with stale version → 409 | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Concurrent update rejected |
| POS checkout `$transaction` failure → 409 | [pos.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/pos.test.ts) | Atomic checkout protected |
| **Driver B claims already-claimed order → 409** | [driver.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/driver.test.ts) | Critical concurrency case verified |
| Invalid state transition (state advanced) → 409 | [chef.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/chef.test.ts) | Double-transition rejected |

**Status: ✅ Verified**

---

## 5. Order State Machine

**Decision**: Every state transition is validated against a frozen state machine. Invalid transitions and role mismatches are rejected.

| Layer | File |
|---|---|
| State Machine | [OrderStateMachine.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/OrderStateMachine.ts) |
| Transition Service | [OrderTransitionService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderTransitionService.ts) |
| Executable Matrix | [OrderTransitionMatrix.ts](file:///d:/Gopal%20Cake%20Shop/tests/matrices/OrderTransitionMatrix.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Valid Chef transitions (NEW→CHEF_ACCEPTED→MAKING→READY_FOR_PICKUP) | [chef.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/chef.test.ts) | State machine correct |
| Invalid transitions → 409 | [chef.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/chef.test.ts) | Invalid paths rejected |
| Full Driver lifecycle matrix | [driver.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/driver.test.ts) | Delivery workflow proven |
| `fail-delivery` without reason → 409 | [driver.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/driver.test.ts) | `requireReason` enforced |
| Unit matrix: all combinations | [OrderStateMachine.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/unit/OrderStateMachine.test.ts) | Pure logic verified |

**Status: ✅ Verified**

---

## 6. API Error Schema

**Decision**: Every error response follows a single consistent schema: `{ success, error: { code, message, details, requestId } }`.

| Layer | File |
|---|---|
| Error factory | [apiUtils.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/apiUtils.ts) → `errorResponse()` |
| Global handler | [withApiHandler.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/withApiHandler.ts) → catch block |

| Evidence | File | What it proves |
|---|---|---|
| Validation → `VALIDATION_ERROR` code | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Schema consistent |
| Concurrency → `CONFLICT` code | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Error mapping correct |
| Unauth → `UNAUTHORIZED` code | [auth.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/auth.test.ts) | Auth schema correct |
| Global wrapper consistency | [infrastructure.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/infrastructure.test.ts) | All errors normalized |

**Status: ✅ Verified**

---

## 7. Cache Control Ownership

**Decision**: The API owns cache headers. Public read APIs set `s-maxage=300`. Sensitive/real-time data sets `no-store`. Mutations invalidate relevant cache tags.

| Layer | File |
|---|---|
| Products | [products/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/public/products/route.ts) → `Cache-Control: public, s-maxage=300` |
| Order tracking | [trackingId/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/public/orders/%5BtrackingId%5D/route.ts) → `Cache-Control: no-store` |
| Settings invalidation | [settings/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/settings/route.ts) → `revalidateTag('settings')` |

| Evidence | File | What it proves |
|---|---|---|
| Products returns `s-maxage=300` | [public-products.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/public-products.test.ts) | CDN-safe header verified |
| Order tracking returns `no-store` | [public-orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/public-orders.test.ts) | Real-time data not cached |
| Settings update calls `revalidateTag` | [settings.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/settings.test.ts) | Cache invalidated on mutation |

**Status: ✅ Verified**

---

## 8. Idempotency

**Decision**: Public checkout accepts an idempotency key. Duplicate requests return the existing result, not a second order.

| Layer | File |
|---|---|
| Schema | [schema.prisma](file:///d:/Gopal%20Cake%20Shop/prisma/schema.prisma) → `Order.idempotencyKey @unique` |
| Enforcement | [checkout/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/public/checkout/route.ts) → dedup check |

| Evidence | File | What it proves |
|---|---|---|
| Duplicate key returns existing order | [public-checkout.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/public-checkout.test.ts) | No double-order |
| Missing key returns 400 | [public-checkout.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/public-checkout.test.ts) | Required field enforced |

**Status: ✅ Verified**

---

## 9. API Versioning

**Decision**: All v1 routes live under `/api/v1/`. New consumers must use versioned paths.

| Layer | File |
|---|---|
| 22 versioned route files | [src/app/api/v1/](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/) |

| Evidence | All 13 integration test suites target `/api/v1/` paths | ✅ |

**Status: ✅ Verified**

---

## 10. DTO Contracts

**Decision**: Request/response shapes are Zod schemas shared between frontend and backend. Internal DB fields must never leak.

| Layer | File |
|---|---|
| DTOs | [src/dtos/](file:///d:/Gopal%20Cake%20Shop/src/dtos/) (9 schema files) |

| Evidence | File | What it proves |
|---|---|---|
| No `db_id` or `_internal_version` leakage | [api.contract.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/contracts/api.contract.test.ts) | Internal fields blocked |
| `customer.phone` present in Driver DTO | [api.contract.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/contracts/api.contract.test.ts) | Critical field guaranteed |
| `updatedAt` is ISO string | [api.contract.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/contracts/api.contract.test.ts) | Frontend date handling correct |

**Status: ✅ Verified**

---

## 11. Audit Trail

**Decision**: Every significant write produces an AuditLog row within the same transaction. Non-negotiable for ERP compliance.

| Layer | File |
|---|---|
| Model | [schema.prisma](file:///d:/Gopal%20Cake%20Shop/prisma/schema.prisma) → `model AuditLog` |
| Order transitions | [OrderTransitionService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderTransitionService.ts) |
| Settings updates | [SettingsService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/SettingsService.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Order create → AuditLog in transaction | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Atomic compliance write |
| Settings update → AuditLog in transaction | [settings.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/settings.test.ts) | Compliance trail atomic |

**Status: ✅ Verified**

---

## 12. Timeline (Event Sourcing Light)

**Decision**: Every state change produces a Timeline row capturing previous state, next state, actor, role, and timestamp.

| Layer | File |
|---|---|
| Model | [schema.prisma](file:///d:/Gopal%20Cake%20Shop/prisma/schema.prisma) → `model Timeline` |
| Writes | [OrderTransitionService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderTransitionService.ts) → `tx.timeline.create` |

| Evidence | File | What it proves |
|---|---|---|
| Order create → Timeline (`action: 'create-draft'`) | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Timeline atomic |
| POS checkout → Timeline (`action: 'checkout'`) | [pos.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/pos.test.ts) | POS timeline verified |
| Transition → Timeline with `nextState` | [chef.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/chef.test.ts) | Full state history |

**Status: ✅ Verified**

---

## 13. Transaction Atomicity

**Decision**: Every multi-table write (Order + Payment + Timeline + AuditLog + Outbox) is wrapped in a single `prisma.$transaction`. Failure rolls back everything.

| Evidence | File | What it proves |
|---|---|---|
| POS rollback → no partial writes | [pos.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/pos.test.ts) | Atomicity enforced |
| Concurrent order PATCH → 409, no state change | [orders.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/orders.test.ts) | Transaction atomic |
| Outbox NOT written if tx rolls back | [outbox.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/outbox/outbox.test.ts) | Cross-table atomicity proven |

**Status: ✅ Verified**

---

## 14. Rate Limiting

**Decision**: Public endpoints use IP-based rate limiting. Authenticated endpoints use token-based. Exceeded limits return `429` with `RATE_LIMIT_EXCEEDED`.

| Layer | File |
|---|---|
| Rate limiter | [rateLimit.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/rateLimit.ts) |
| Enforcement | [withApiHandler.ts](file:///d:/Gopal%20Cake%20Shop/src/lib/withApiHandler.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Rate limit exceeded → 429 + `RATE_LIMIT_EXCEEDED` | [infrastructure.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/infrastructure.test.ts) | Limit enforced |

**Status: ✅ Verified**

---

## 15. Notification Pipeline

**Decision**: State transitions trigger `NotificationLog` rows (PENDING). A background worker processes them asynchronously. The API never sends notifications synchronously.

| Layer | File |
|---|---|
| NotificationLog | [schema.prisma](file:///d:/Gopal%20Cake%20Shop/prisma/schema.prisma) → `model NotificationLog` |
| Async dispatch | [OrderTransitionService.ts](file:///d:/Gopal%20Cake%20Shop/src/services/OrderTransitionService.ts) → `tx.notificationLog.create` |
| InApp Inbox | [inbox/route.ts](file:///d:/Gopal%20Cake%20Shop/src/app/api/v1/notifications/inbox/route.ts) |

| Evidence | File | What it proves |
|---|---|---|
| Ordering: unread → priority → newest | [notifications.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/notifications.test.ts) | Sort logic verified |
| Expired notifications filtered | [notifications.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/notifications.test.ts) | Expiry rule enforced |
| Ownership enforced → 404 on other user | [notifications.test.ts](file:///d:/Gopal%20Cake%20Shop/tests/integration/api/notifications.test.ts) | Cross-user access blocked |

**Status: ✅ Verified**

---

## Summary Matrix

| # | Architectural Rule | Status |
|---|---|---|
| 1 | Transactional Outbox Pattern | ✅ Verified |
| 2 | RBAC — Role-Based Access Control | ✅ Verified |
| 3 | Branch Isolation | ✅ Verified |
| 4 | Optimistic Concurrency | ✅ Verified |
| 5 | Order State Machine | ✅ Verified |
| 6 | API Error Schema | ✅ Verified |
| 7 | Cache Control Ownership | ✅ Verified |
| 8 | Idempotency | ✅ Verified |
| 9 | API Versioning | ✅ Verified |
| 10 | DTO Contracts | ✅ Verified |
| 11 | Audit Trail | ✅ Verified |
| 12 | Timeline | ✅ Verified |
| 13 | Transaction Atomicity | ✅ Verified |
| 14 | Rate Limiting | ✅ Verified |
| 15 | Notification Pipeline | ✅ Verified |

**15 / 15 architectural decisions verified. ✅**

---

## Test Coverage Map

| Suite | Location | Boundary |
|---|---|---|
| Unit Tests | `tests/unit/` (6 files) | Pure logic, no I/O |
| Service Integration | `tests/integration/` (7 files) | DB-mocked service layer |
| API Integration | `tests/integration/api/` (13 files) | HTTP → Service → DB |
| Outbox Suite | `tests/integration/outbox/` (1 file) | Transactional event pattern |
| Consumer Contracts | `tests/contracts/` (4 files) | DTO schema shape |
| E2E | `tests/e2e/` | Phase 2.5 |

---

## Remaining Verification Phases

| Phase | Title | Status |
|---|---|---|
| **2.4** | Distributed Workflow Verification | ⏳ Next |
| **2.5** | End-to-End Operational Workflows | ⏳ |
| **2.6** | Performance, Reliability & Chaos | ⏳ |
| **2.7** | Production Hardening & Release | ⏳ |
