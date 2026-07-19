# Project Backlog

This document captures proposed features, schema changes, or roadmap expansions discovered during implementation that are deferred to a future release to prevent scope creep during an active Architecture Freeze.

## Backlog Items

## Deferred from v1.1.0 Dashboards (Phase 1 Review)

The following improvements and architectural refinements were identified during the implementation of the v1.1.0 Dashboard APIs and UIs. Per the Architecture Freeze policy, they are logged here for future development (e.g., v1.4):

- **KPI Metadata Refinement:** Expand scalar KPI return values (e.g., `15000`) into richer metadata objects including `value`, `lastUpdated`, `trend`, and `currency`.
- **Cache Key Documentation:** Explicitly document the cache invalidation strategy for dashboard routes (e.g., event-driven revalidation vs. standard TTL) in API docs.
- **DTO Versioning:** Freeze the `DashboardKPIs` contract. Ensure future updates are strictly additive and avoid renaming fields.
- **Service Organization:** Refactor `ReportingService` into specialized domain services (e.g., `DashboardService`, `RevenueService`, `TrendService`, `ExportService`, `CustomerAnalytics`) to prevent single-class bloat as the system scales.
- **Query Optimization:** Refactor KPI generation to use consistent database read snapshots or a single database transaction. Profile and consolidate multiple Prisma queries into fewer aggregate queries.
- `[ ]` **Generic Time-Series Chart API:** Update endpoints like `revenueTrend` to return generic time-series arrays (e.g., `{ label: string, value: number }`) to maximize frontend reusability.

## Deferred from v1.1.0 Payments (Phase 4 Review)

- `[ ]` **Payment Reconciliation UI:** Create an admin/finance view to cross-check Gateway Payment, Payment Record, Ledger Entry, Order Status, and Timeline events to quickly identify discrepancies (e.g., "Ledger missing" or "Payment verified but order not confirmed").
- `[ ]` **Scheduled Reconciliation Job:** Implement a cron job (e.g., every hour) to query the Razorpay API for PENDING payments older than 15 minutes and repair the local state if webhooks or client callbacks were missed.
