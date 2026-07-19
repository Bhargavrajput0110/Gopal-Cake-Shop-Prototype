# Architecture Decision Records (ADRs) - v1.0.0 Baseline

This document indexes the foundational Architecture Decision Records (ADRs) established during the development of Gopal Cake Shop v1.0.0. These decisions represent the frozen architecture baseline for the v1.0.0 release.

## ADR-001: Modular Monolith Architecture
- **Context**: The system requires clear boundaries between domains (Public, Admin, Chef, Delivery, Sales) without the operational complexity of microservices.
- **Decision**: Adopt a Modular Monolith using Next.js 14 App Router. Enforce module boundaries via directory structure and RBAC.
- **Status**: Frozen.

## ADR-002: Framework Selection (Next.js 14 App Router)
- **Context**: Need React-based full-stack framework with strong SSR/SSG capabilities.
- **Decision**: Next.js 14 App Router using Server Actions for data mutations and Server Components for data fetching.
- **Status**: Frozen.

## ADR-003: Centralized Authentication (Supabase Auth)
- **Context**: Custom auth is risky and time-consuming.
- **Decision**: Use Supabase Auth (JWTs) via `@supabase/ssr`. Role-based access control (RBAC) enforced via standard JWT claims.
- **Status**: Frozen.

## ADR-004: Relational Database with Prisma ORM
- **Context**: The schema has tight relational constraints (Orders to Customers, Branches to Products).
- **Decision**: Use PostgreSQL as the relational engine and Prisma ORM for type-safe schema generation and migrations.
- **Status**: Frozen.

## ADR-005: Event-Driven Pattern via Transactional Outbox
- **Context**: Decoupling domains (e.g., Checkout from Notifications) while ensuring database transaction safety.
- **Decision**: Implement the Transactional Outbox pattern. Domain events (`ORDER_CREATED`) are inserted atomically with business logic changes.
- **Status**: Frozen.

## ADR-006: Order State Machine
- **Context**: Complex order lifecycle involving multiple roles (Customer -> Manager -> Chef -> Delivery).
- **Decision**: Implement a strict finite state machine in `OrderStateMachine.ts` validating all state transitions before database mutations.
- **Status**: Frozen.

## ADR-007: Optimistic Concurrency Control
- **Context**: Multiple delivery drivers might attempt to claim the same order simultaneously.
- **Decision**: Use Optimistic Row-Level Locking via Prisma `updateMany` (e.g., `where: { status: 'READY_FOR_PICKUP' }, data: { status: 'ASSIGNED_TO_DRIVER' }`).
- **Status**: Frozen.

## ADR-008: Form Validation with Zod
- **Context**: Consistent validation required across frontend inputs and backend APIs.
- **Decision**: Define single-source-of-truth Zod schemas in `src/dtos/` and share them across Server Actions and API Routes.
- **Status**: Frozen.

## ADR-009: Global Error Handling
- **Context**: APIs and Server Actions must return consistent error shapes.
- **Decision**: Create a `withApiHandler` wrapper for REST APIs, catching known `ZodError`, `PrismaClientKnownRequestError`, and `AppError` and mapping them to standardized HTTP responses.
- **Status**: Frozen.

## ADR-010: Design System (Shadcn/Radix)
- **Context**: Need a rapid, accessible UI component library.
- **Decision**: Use Shadcn UI built on Radix primitives and Tailwind CSS.
- **Status**: Frozen.

## ADR-011: PWA Implementation
- **Context**: Offline capabilities and app-like installation needed for staff and customers.
- **Decision**: Implement standard Service Worker (`next-pwa` or custom sw) with a Web App Manifest.
- **Status**: Frozen.

## ADR-012: Environment Configuration
- **Context**: Multiple deployment environments (Development, Test, Production).
- **Decision**: Strict `.env` parsing and environment variable isolation (`.env.test` for Vitest).
- **Status**: Frozen.

## ADR-013: Integration Testing Strategy
- **Context**: Fast feedback loop vs. Real database guarantees.
- **Decision**: Dual-suite strategy. Mocked `prisma` for fast CI runs; Real `PostgreSQL` for destructive transactional tests.
- **Status**: Frozen.

## ADR-014: E2E Testing with Playwright
- **Context**: Need user journey smoke tests across all dashboards.
- **Decision**: Playwright for end-to-end browser automation covering critical paths (Checkout, KDS workflow).
- **Status**: Frozen.

## ADR-015: File Upload & Media Strategy
- **Context**: Handling product imagery reliably.
- **Decision**: Defer self-hosted storage in favor of Cloudinary (implemented in v1.1.0).
- **Status**: Frozen.
