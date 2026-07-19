# Scope: E2E Testing Track

## Architecture
- **E2E Test Framework**: Playwright (TypeScript)
- **Application Stack**: Next.js 16 (App Router), custom Socket.io server, Supabase/PostgreSQL.
- **E2E Targets**:
  - Customer Flows: Homepage, product selection, cart management, checkout (order creation), tracking page.
  - Staff Flows: Authentication (login with role/branch/PIN), order management/history dashboards.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Setup & Exploration | Install Playwright, configure it, explore code for key selector details | None | PLANNED |
| 2 | Tier 1-2 Tests | Implement Tier 1 (Feature Coverage) and Tier 2 (Boundary & Edge) tests | Milestone 1 | PLANNED |
| 3 | Tier 3-4 Tests | Implement Tier 3 (Cross-Feature Combinations) and Tier 4 (Real-world scenarios) tests | Milestone 2 | PLANNED |
| 4 | Verification & Reporting | Run reviewer and challenger verification, generate TEST_INFRA.md, TEST_READY.md | Milestone 3 | PLANNED |

## Interface Contracts
### E2E Test Suite Run Command
- Command: `npx playwright test`
- Expected: All test cases pass, returning exit code 0.
