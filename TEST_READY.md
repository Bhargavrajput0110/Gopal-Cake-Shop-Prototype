# Playwright E2E Tests Ready

This document contains the commands, expected exit codes, and coverage count details for the Gopal Cake Shop E2E test suite.

## 🚀 Test Execution Command
To run all Playwright E2E tests:

```bash
npx playwright test
```

To run with UI mode:
```bash
npx playwright test --ui
```

To run a specific test file:
```bash
npx playwright test tests/e2e/e2e.spec.ts
```

## 📊 Expected Exit Codes
- **Pass**: `0`
- **Fail**: Non-zero code (e.g. `1` or higher)

## 📈 E2E Test Coverage Count
A total of **21 test cases** are implemented across the 4 tiers of tests:

- **Tier 1 (Feature Coverage)**: 10 test cases (5 Customer Flows + 5 Staff Authentications)
- **Tier 2 (Boundary & Corner Cases)**: 9 test cases (5 Customer Boundaries + 4 Staff Login Boundaries)
- **Tier 3 (Combinations)**: 2 test cases (Combo 1 + Combo 2)
- **Tier 4 (Real-world Scenario)**: 1 test case (Complete Order Lifecycle)
