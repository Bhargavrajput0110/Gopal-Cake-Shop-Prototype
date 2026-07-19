# Architecture Decision Records (ADRs)

This document tracks all major architecture decisions for the Gopal Cake Shop ERP. These records preserve the context behind "why" a decision was made.

---

### ADR-001: Prisma selected over Drizzle
**Date:** [Initial Setup]
**Context:** We needed a robust ORM to handle complex relationships and rapid schema iterations.
**Decision:** Selected Prisma.
**Reason:** Prisma provides an incredibly intuitive schema language, excellent migration tooling, and generates a fully type-safe client that accelerates development compared to Drizzle's slightly more manual schema definition process.

---

### ADR-002: Tailwind v4 selected
**Date:** [Initial Setup]
**Context:** Needed a scalable styling solution.
**Decision:** Selected Tailwind v4.
**Reason:** Tailwind provides utility-first CSS that keeps styling co-located with components. V4 offers performance improvements and simpler configuration.

---

### ADR-003: OrderTransitionService is sole writer
**Date:** Phase 5 (State Machine Implementation)
**Context:** Order status updates were scattered across multiple controllers, risking invalid state transitions.
**Decision:** Centralized all order state changes into a single `OrderTransitionService`.
**Reason:** Enforces a strict finite state machine, guaranteeing an order cannot transition from "PENDING" directly to "DELIVERED" without proper validation and audit logging.

---

### ADR-004: ConfirmationDialog replaces window.confirm
**Date:** Phase 5 (CRUD Standard Implementation)
**Context:** Destructive actions needed user confirmation, but `window.confirm` breaks the premium UI experience.
**Decision:** Built and mandated the use of a `<ConfirmationDialog />` Design System primitive.
**Reason:** Provides theme consistency, animation support, and allows for dynamic descriptive context before destructive actions.

---

### ADR-005: Decoupled API Client Layer
**Date:** Phase 5 (CRUD Refinements)
**Context:** Frontend components were handling direct `fetch()` calls, mixing networking logic with UI.
**Decision:** Introduced a strict `Frontend API Client` layer (`src/lib/api/*.ts`) and prohibited direct `fetch()` calls in React components.
**Reason:** Separates concerns, centralizes error handling, standardizes request headers, and prevents naming confusion with Backend Services.

---

### ADR-006: Soft Delete Policy
**Date:** Phase 5 (CRUD Refinements)
**Context:** Need consistency on data deletion to prevent breaking historical records.
**Decision:** 
- Soft Delete: Products, Coupons, Users.
- Never Delete: Orders, Payments, Audit Logs.
- Append Only: Timeline.
**Reason:** Preserves referential integrity for financial and audit history while allowing operational data to be "removed" from active views.

---

### ADR-007: Single Aggregate Root per Service
**Date:** Phase 5 (Backend Conventions)
**Context:** Services were becoming entangled, calling each other circularly.
**Decision:** One backend service = one aggregate root.
**Reason:** Keeps domain boundaries clean and prevents monolithic service files. Cross-domain coordination should happen at the controller/API route level, not deep within a service.
