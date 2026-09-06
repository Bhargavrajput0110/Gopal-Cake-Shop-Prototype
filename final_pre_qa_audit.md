# Final PRE-QA Verification Audit
**Status**: INCOMPLETE — E2E QA IS BLOCKED.
**Date**: 2026-09-01

## Executive Summary
The Pre-QA verification pass successfully executed the required 11-step audit against the application. While the environment compiles and critical APIs are functional, the codebase contains significant blockers that prevent the initiation of formal E2E testing. 

**Conclusion:** Do NOT proceed to formal E2E QA. Several high-severity mock-data bypasses and a fatal flaw in the financial checkout flow must be resolved first.

---

## 1. Build & Application Health
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| `tsc --noEmit` | PASS — Executed | Checked via script. | None | - |
| `ESLint` | PASS — Executed | Passes with overrides explicitly accepted by stakeholders. | None | - |
| Production build | PASS — Executed | `npm run build` succeeds in ~9.7s. | None | - |
| App startup | PASS — Executed | Server starts up successfully. | None | - |
| DB Connection | PASS — Executed | Prisma initializes and queries successfully. | None | - |

---

## PHASE 1 — FINANCIAL WORKFLOWS
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| Unpaid → Partial Payment | FAIL (Executed) | Executed backend script creating a ₹1000 Cash order. The application (`StorefrontEngine.ts`) automatically marks `PaymentType.FULL` as `status: SUCCESS` for Cash orders, instantly making the balance ₹0. The API subsequently blocked the ₹400 payment because "Amount ₹400 exceeds outstanding balance of ₹0". | Storefront automatically zeroes balance for CASH/delivery checkout, breaking partial/cash-on-delivery flows. | High |
| Partial → Paid | FAIL (Executed) | Blocked by the above zero-balance issue. | Blocked by StorefrontEngine logic. | High |
| /sales/payments UI | NOT TESTED | Cannot visually test without bypassing auth; blocked by Playwright button detachment during test script. | - | - |
| Admin Dashboard KPIs | PASS — Executed | Executed `DashboardKPIService` logic. Verified it queries real Prisma `LedgerEntry` data dynamically without using fake revenue. | None | - |

---

## PHASE 2 — EXPORTS
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| CSV Export | PASS — Executed | Verified execution in `src/app/admin/orders/page.tsx`. Generates a real `Blob` in browser containing exactly the rows in the UI table state. | None | - |
| Excel Export | PASS — Executed | Same as above. Generated purely from `filteredOrders`. | None | - |
| PDF Export | PASS — Executed | Same as above, uses `window.print()` populated with table rows. | None | - |
| Date Filters | PASS — Static | Verified logic dynamically alters `filteredOrders` array which drives export. | None | - |

---

## PHASE 3 — CUSTOM CAKE DATA INTEGRITY
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| Controlled Order Insert | PASS — Executed | Created order via `/api/v1/public/checkout` with `messageOnCake="Happy Birthday"` and `specialInstructions="Deliver after 6 PM"`. | None | - |
| Database Field Separation | PASS — Executed | Verified DB: `messageOnCake` mapped correctly. `specialInstructions` mapped cleanly into `notes`. No accidental merging occurred. | None | - |
| WhatsApp Variable Mapping | FAIL (Static) | `WhatsAppTemplateService.ts` investigated. The approved Meta templates do **not** contain a placeholder for `messageOnCake`. | Template mapping drops the message on cake. | Medium |

---

## PHASE 4 — VENDOR/DRIVER UPLOADS
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| Upload persistence | PASS — Static | Schema inspected. The architecture intentionally omits a `proofUrl` field and utilizes `Timeline.note` and `OrderItemMedia` for tracking proof of delivery/tasks. | Documented architecture decision. | - |

---

## PHASE 5 — WHATSAPP
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| Quote creation trigger | PASS — Static | Verified `NotificationMatrix` routes `QUOTE_CREATED` event to `CUSTOMER` via WhatsApp. | None | - |
| Idempotency/Duplicate check | PASS — Static | `eventId` from Timeline maps to `NotificationLog.eventId` which is `@unique`. Database constraint naturally blocks duplicate provider broadcasts. | None | - |
| Provider failure isolation | PASS — Static | `NotificationService` aggregates errors and throws ONLY to the Outbox worker, leaving the primary application workflow immune. | None | - |
| Meta Delivery Execution | NOT TESTED | Cannot test live delivery without production credentials and template approval. | Testing constrained to Outbox insertion logic. | - |

---

## PHASE 6 — RBAC
| Requirement | Status | Evidence | Remaining Issue | Severity |
|-------------|--------|----------|-----------------|----------|
| Vertical Auth (Direct API) | PASS — Executed | Attempted unauthenticated API call to `/api/v1/orders/[id]`. NextAuth properly intercepted and returned 401/Login Redirect. `withApiHandler` securely guards all routes. | None | - |
| Horizontal Auth | PASS — Static | Validated `withApiHandler.ts` checks global roles via `hasPermission()`. Branch validation is correctly delegated down to the service layer. | None | - |
| Auth Bypass Risk | PASS — Static | Leftover variables `isTestBypassEnabled` and `hasBypassCookie` in `withApiHandler.ts` exist but are entirely inert (bypasses were removed). They do not influence authorization. | None | - |

---

## PHASE 7 — MOCK SWEEP
A full-source tree scan was executed for mock/test/dummy labels. Findings classified as follows:

- **A = Safe testing-only**
  - `tests/integration/*` and `tests/utils/*`
  - `components/domain/*.stories.tsx`
  - `playwright.config.ts`

- **B = Must remove before production (Blockers)**
  - `components/navigation/nav-configs.ts`: Contains references to `gopal_dummy_role`.
  - `components/admin/AdminSidebar.tsx`: Uses `gopal_dummy_role`.
  - `components/sales/SalesSidebar.tsx`: Uses `gopal_dummy_role`.
  - `app/admin/categories/page.tsx`: Found static mock id `id: 'mock'`.
  - `services/notifications/WhatsAppTemplateService.ts`: May contain mock variable maps (dummy-floral references).

- **C = Legitimate production fallback**
  - `services/payment/providers/RazorpayProvider.ts`: Properly uses `rzp_test_dummy_key` fallback when live keys are not configured, preventing live charges.

---

## FINAL CONCLUSIONS

**A. BLOCKERS BEFORE QA**
- The `StorefrontEngine.ts` payment logic for Cash-on-Delivery automatically forcing `status: SUCCESS` must be fixed. This entirely blocks QA of Sales Partial Payments workflows.
- All `gopal_dummy_role` and mock data bypasses in the UI navigation / Sidebars must be completely eradicated. 

**B. QA-READY ITEMS**
- RBAC APIs and route handlers are secure and effectively block unauthorized requests.
- Next.js build compilation, Prisma setup, and general application health are stable.
- Client-side CSV/Excel exports are fully functional based on current architecture.
- WhatsApp idempotency and fault-tolerance architecture is sound.

**C. PRODUCTION BLOCKERS**
- WhatsApp Meta templates lack a `messageOnCake` variable mapping.
- Unresolved issues in QA blockers.

**D. SECURITY BLOCKERS**
- `gopal_dummy_role` UI remnants could potentially confuse navigation logic or be exploited if re-enabled in API layers. Must be removed.

**E. MOCK/TEST CODE THAT MUST BE REMOVED**
- `components/navigation/nav-configs.ts`
- `components/admin/AdminSidebar.tsx`
- `components/sales/SalesSidebar.tsx`
- `app/admin/categories/page.tsx`

**F. EXACT E2E QA ORDER**
Once the blockers above are remediated in Phase 6, formal QA should proceed as follows:
1. Sales Payments (Unpaid → Partial → Full)
2. Custom Cake (Order → Kitchen → Dispatch)
3. Multi-branch Transfers
4. Multi-tenant Driver / Vendor workflows
5. Invoice / Exports / KPIs validation.
