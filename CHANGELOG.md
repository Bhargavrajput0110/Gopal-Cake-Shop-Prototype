# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-11

### Added
- **Core Architecture**: Modular monolith implementation using Next.js 14 App Router, strict domain-driven design, and Server Actions.
- **Database Architecture**: Prisma PostgreSQL schema with transactional integrity, optimistic concurrency control, and domain events.
- **Authentication & RBAC**: Centralized Supabase JWT Auth with Role-Based Access Control (Admin, Sales, Chef, Delivery, Vendor, Manager, User).
- **Public Storefront**: Customer PWA with caching, interactive catalog, Cart Context, and public checkout API.
- **Outbox Pattern**: Reliable domain event persistence (`ORDER_CREATED`, `ORDER_ASSIGNED_TO_DRIVER`, etc.) using a transactional outbox table.
- **Order State Machine**: Finite state machine enforcing valid transitions for Order lifecycle (`DRAFT` -> `PENDING_PAYMENT` -> `WAITING_FOR_CHEF` -> `MAKING` -> `READY_FOR_PICKUP` -> `ASSIGNED_TO_DRIVER` -> `DELIVERED`).
- **Chef Dashboard (KDS)**: Kitchen Display System for managing food preparation phases.
- **Delivery Dashboard**: Real-time order claiming with optimistic row-level locking to prevent duplicate claims.
- **Sales POS**: Point of Sale dashboard for counter staff.
- **Vendor & Admin Dashboards**: Role-specific portals for operations management.
- **Automated Testing Suite**: 
  - 65/65 Integration Mock Suite for CI (Vitest).
  - Destructive Real PostgreSQL Core Transaction Suite for Release validation.
  - E2E Playwright Smoke and Journey tests.

### Changed
- Shifted away from Vercel-specific deployments to Docker-ready environment for hybrid cloud hosting.
- Upgraded components to Shadcn/Radix UI for unified design system.

### Fixed
- Stabilized database connection pool for heavy load.
- Resolved race conditions in driver assignment.
