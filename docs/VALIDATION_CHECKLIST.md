# Bakery OS v1.1.0 — Production Validation Checklist

> This document is the evidence record for the v1.1.0 production approval gate.
> Each section must be completed and signed off before production deployment is approved.
> Attach or link artifacts (test reports, logs, screenshots) for every gate.

---

## Gate 1 — Razorpay Live Validation

**Environment:** `[ ] Test Mode` `[ ] Live Mode`
**Date executed:** _______________
**Executed by:** _______________
**Artifact:** _(attach test run log or Razorpay dashboard screenshot)_

| Test Case | Result | Notes |
|---|---|---|
| Checkout creation — order created in Razorpay dashboard | `[ ] Pass` `[ ] Fail` | |
| Payment success — `payment.captured` webhook received and processed | `[ ] Pass` `[ ] Fail` | |
| Payment failure — `payment.failed` webhook received, order not marked paid | `[ ] Pass` `[ ] Fail` | |
| Webhook signature verification — invalid signature rejected (HTTP 400) | `[ ] Pass` `[ ] Fail` | |
| Duplicate webhook — second identical webhook produces no duplicate LedgerEntry | `[ ] Pass` `[ ] Fail` | |
| Reconciliation — stale PENDING payment resolved correctly by cron job | `[ ] Pass` `[ ] Fail` | |

**Gate 1 sign-off:** `[ ] PASSED` `[ ] FAILED — blocked`
**Signed by:** _______________ **Date:** _______________

---

## Gate 2 — Staging Smoke Test

**Staging URL:** _______________
**Date executed:** _______________
**Executed by:** _______________
**Artifact:** _(attach screen recording or step-by-step log)_

### Full Order Lifecycle
| Step | Result | Notes |
|---|---|---|
| Create order (Sales POS) | `[ ] Pass` `[ ] Fail` | |
| Approve order (Manager/Sales) | `[ ] Pass` `[ ] Fail` | |
| Chef accepts order | `[ ] Pass` `[ ] Fail` | |
| Order enters production (Making → Decorating) | `[ ] Pass` `[ ] Fail` | |
| Order marked Ready | `[ ] Pass` `[ ] Fail` | |
| Driver assigned (Delivery order) | `[ ] Pass` `[ ] Fail` | |
| Order delivered | `[ ] Pass` `[ ] Fail` | |
| Payment confirmed | `[ ] Pass` `[ ] Fail` | |

### Supporting Systems
| Check | Result | Notes |
|---|---|---|
| In-app notifications received by correct roles at each step | `[ ] Pass` `[ ] Fail` | |
| SSE bell updates in real-time (no manual refresh needed) | `[ ] Pass` `[ ] Fail` | |
| LedgerEntry created after payment confirmation | `[ ] Pass` `[ ] Fail` | |
| Audit log records Admin overrides correctly | `[ ] Pass` `[ ] Fail` | |
| Branch transfer request → approval workflow | `[ ] Pass` `[ ] Fail` | |
| Analytics KPIs reflect completed order correctly | `[ ] Pass` `[ ] Fail` | |
| Health check `/api/v1/health/deep` returns all green | `[ ] Pass` `[ ] Fail` | |

**Gate 2 sign-off:** `[ ] PASSED` `[ ] FAILED — blocked`
**Signed by:** _______________ **Date:** _______________

---

## Gate 3 — Production Environment Verification

**Date executed:** _______________
**Executed by:** _______________

| Variable Group | Verified | Notes |
|---|---|---|
| `DATABASE_URL` — connects to production DB | `[ ] Yes` `[ ] No` | |
| `NEXTAUTH_SECRET` — set and not default | `[ ] Yes` `[ ] No` | |
| `NEXTAUTH_URL` — points to production domain | `[ ] Yes` `[ ] No` | |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | `[ ] Yes` `[ ] No` | |
| `RAZORPAY_WEBHOOK_SECRET` | `[ ] Yes` `[ ] No` | |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[ ] Yes` `[ ] No` | |
| `CLOUDINARY_*` credentials | `[ ] Yes` `[ ] No` | |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `[ ] Yes` `[ ] No` | |
| `WHATSAPP_API_TOKEN` (if required at launch) | `[ ] Yes` `[ ] No` `[ ] Deferred` | |
| `DISTANCE_PROVIDER` + maps key (if Google Maps enabled) | `[ ] Yes` `[ ] No` `[ ] Deferred` | |
| `CRON_SECRET` — set and secured | `[ ] Yes` `[ ] No` | |
| `NODE_ENV=production` | `[ ] Yes` `[ ] No` | |
| App startup validation passes (`validateEnv()`) | `[ ] Yes` `[ ] No` | |

**Gate 3 sign-off:** `[ ] PASSED` `[ ] FAILED — blocked`
**Signed by:** _______________ **Date:** _______________

---

## Gate 4 — UAT (User Acceptance Testing)

**UAT session date:** _______________
**Stakeholder / client name:** _______________
**Conducted by:** _______________
**Artifact:** _(attach UAT session notes or signed approval email)_

| Scenario | Client Verdict | Notes |
|---|---|---|
| Staff login flow (role selection → PIN → dashboard) | `[ ] Accepted` `[ ] Issue` | |
| Sales POS — cake order creation | `[ ] Accepted` `[ ] Issue` | |
| Kitchen display — order queue and status updates | `[ ] Accepted` `[ ] Issue` | |
| Driver app — delivery task list and status updates | `[ ] Accepted` `[ ] Issue` | |
| Manager dashboard — analytics and KPIs | `[ ] Accepted` `[ ] Issue` | |
| Admin — branch management and user management | `[ ] Accepted` `[ ] Issue` | |
| Customer order tracking | `[ ] Accepted` `[ ] Issue` | |
| Notification bell — real-time updates | `[ ] Accepted` `[ ] Issue` | |

**Open issues from UAT session:**
_(list any issues raised by the client)_

**Client sign-off statement:**
> "I have reviewed Bakery OS v1.1.0 and confirm that the system behaves as expected for the agreed scope."

**Client signature:** _______________ **Date:** _______________

---

## Gate 5 — Final Defect Review

**Date:** _______________
**Reviewed by:** _______________

| Severity | Count | Disposition |
|---|---|---|
| Critical | ___ | Must be zero before launch |
| High | ___ | Must be zero before launch |
| Medium | ___ | Document and schedule fix |
| Low | ___ | Backlog acceptable |

**Gate 5 sign-off:** `[ ] PASSED — no Critical/High defects` `[ ] BLOCKED`
**Signed by:** _______________ **Date:** _______________

---

## Production Deployment Approval

All five gates must be signed off before this approval is granted.

| Gate | Status |
|---|---|
| Gate 1 — Razorpay Live Validation | `[ ] PASSED` `[ ] PENDING` `[ ] BLOCKED` |
| Gate 2 — Staging Smoke Test | `[ ] PASSED` `[ ] PENDING` `[ ] BLOCKED` |
| Gate 3 — Environment Verification | `[ ] PASSED` `[ ] PENDING` `[ ] BLOCKED` |
| Gate 4 — UAT Sign-off | `[ ] PASSED` `[ ] PENDING` `[ ] BLOCKED` |
| Gate 5 — Defect Review | `[ ] PASSED` `[ ] PENDING` `[ ] BLOCKED` |

---

**PRODUCTION DEPLOYMENT:** `[ ] APPROVED` `[ ] NOT APPROVED`

**Approved by:** _______________ **Date:** _______________

**Release tag:** `v1.1.0`
**Deployment target:** _______________
**Deployment date:** _______________
