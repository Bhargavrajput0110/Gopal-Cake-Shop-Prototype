# Bakery OS v1.1.x — Official Gate 2 Manual Smoke Test Template

## Document Metadata
| Field | Value |
| :--- | :--- |
| Document Version | v1.1.x Baseline Template |
| Owner | Development Team |
| Last Updated | ____________________ |
| Status | Approved Template |

---

**Environment:** Staging / Render RC
**Version:** v1.1.0 RC
**Git Commit:** ____________________
**Deployment URL:** ____________________
**Deployment Timestamp:** ____________________
**Seed Version:** ____________________
**Database Migration Version:** ____________________

**Date:** ____________________
**Overall Start Time:** ____________  **Overall End Time:** ____________  **Overall Duration:** ____________
**Tester:** ____________________

---

## 0. Build & Environment Verification

**Build Verification Summary:**
| Verification | Result |
| :--- | :---: |
| `npm run build` | ☐ Pass |
| TypeScript Compilation | ☐ Pass |
| ESLint | ☐ Pass |
| Production Bundle Generated | ☐ Pass |

**Prerequisites:**
- [ ] Latest Release Candidate (RC) deployed to Render
- [ ] Database migrations executed (`prisma migrate deploy`)
- [ ] Seed data loaded (e.g., `npm run seed-rc1`)
- [ ] Render cron jobs configured
- [ ] Environment variables configured correctly
- [ ] Test staff accounts and test payment credentials available

**API Health Verification:**
| Service | Expected | Actual | Pass |
| :--- | :--- | :--- | :---: |
| API | Healthy | | ☐ |
| Database | Healthy | | ☐ |
| Authentication | Healthy | | ☐ |
| Maps/External | Configured | | ☐ |

**Browser/Device Compatibility Test Matrix:**
| Browser / Device | Version | Pass/Fail | Notes |
| :--- | :--- | :---: | :--- |
| Google Chrome (Desktop) | | ☐ | |
| Microsoft Edge (Desktop) | | ☐ | |
| Mozilla Firefox (Desktop) | | ☐ | |
| Mobile Chrome / Safari | | ☐ | |

---

## Test Order Information

| Field | Value |
| :--- | :--- |
| Order Number | __________________ |
| Tracking ID | __________________ |
| Customer Name | __________________ |
| Branch | __________________ |
| Order Type | ☐ Pickup ☐ Delivery |
| Payment Method | __________________ |
| Assigned Chef | __________________ |
| Assigned Driver | __________________ |

---

## 1. Authentication
*Workflow Start: ________ End: ________ Duration: ________*

| Test | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Manager Login | Dashboard opens, correct branch | | ☐ |
| Sales Login | Sales dashboard opens | | ☐ |
| Chef Login | Kitchen dashboard opens | | ☐ |
| Driver Login | Delivery dashboard opens | | ☐ |
| Logout | Session destroyed and protected routes blocked | | ☐ |

**Section 1 Result: ☐ PASS  ☐ FAIL**

---

## 2. Sales Workflow
*Workflow Start: ________ End: ________ Duration: ________*

| Test | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Create Order | Order created successfully | | ☐ |
| Sales Queue | Order appears immediately | | ☐ |
| Customer Details | Correct data displayed | | ☐ |
| Order Number | Generated and visible | | ☐ |
| Tracking ID | Generated and visible | | ☐ |
| Payment Status | Accurately reflects payment state | | ☐ |

**Section 2 Result: ☐ PASS  ☐ FAIL**

---

## 3. Kitchen Workflow
*Workflow Start: ________ End: ________ Duration: ________*

| Test | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Order visible in KDS | Chef sees new order | | ☐ |
| Accept Order | Success | | ☐ |
| Start Making | Status changes to Preparing | | ☐ |
| Ready for Pickup | Status changes to Ready | | ☐ |
| Parent Order Updated | Parent status advances correctly | | ☐ |
| Timeline Updated | Entry created for Chef actions | | ☐ |
| Notification Generated | In-app notification appears | | ☐ |

**Section 3 Result: ☐ PASS  ☐ FAIL**

---

## 4. Delivery Workflow
*Workflow Start: ________ End: ________ Duration: ________*

| Test | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Delivery Visible | Driver sees order in queue | | ☐ |
| Claim Delivery | Success | | ☐ |
| Picked Up | Status updated to Out for Delivery | | ☐ |
| Delivered | Status updated to Delivered | | ☐ |
| Final Order Status | Master Order marked Completed | | ☐ |

**Section 4 Result: ☐ PASS  ☐ FAIL**

---

## 5. Customer Tracking
**Tracking ID:** ________________________
*Workflow Start: ________ End: ________ Duration: ________*

| Stage | Expected Status | Actual Status | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Order Received | Active | | ☐ |
| Making | Active | | ☐ |
| Ready for Pickup | Active | | ☐ |
| Out for Delivery | Active | | ☐ |
| Delivered | Completed | | ☐ |

**Section 5 Result: ☐ PASS  ☐ FAIL**

---

## 6. Backend Verification

| Verification | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Order Persistence | Saved correctly in primary DB | | ☐ |
| Payment Transaction | Transaction securely recorded *(If online payment was used)* | | ☐ |
| Analytics Updated | Sales/Order stats incremented | | ☐ |
| Ledger Entry | Accounting entry generated | | ☐ |
| Inventory Updated | Stock decremented *(If inventory module is enabled)* | | ☐ |
| Timeline Complete | Full lifecycle trace available | | ☐ |
| Audit Log Complete | State changes audited | | ☐ |
| Notification Bell | App notifications successfully sent | | ☐ |
| Outbox Processing | No stuck events *(If asynchronous jobs are enabled)* | | ☐ |
| Background Jobs | No failed worker tasks | | ☐ |
| Console/Server | No runtime/unhandled errors | | ☐ |

**Section 6 Result: ☐ PASS  ☐ FAIL**

---

## 7. Performance Verification
*Target values represent acceptance thresholds under normal staging conditions.*

| Test | Target | Actual | Pass/Fail |
| :--- | :--- | :--- | :---: |
| Login | < 3 sec | | ☐ |
| Create Order | < 3 sec | | ☐ |
| KDS Update | < 2 sec | | ☐ |
| Tracking Update | < 2 sec | | ☐ |

---

## 8. Evidence Collection

Attach or reference the following:
- [ ] Screenshot – Order Created
- [ ] Screenshot – Sales Dashboard
- [ ] Screenshot – Kitchen Dashboard
- [ ] Screenshot – Driver Dashboard
- [ ] Screenshot – Customer Tracking
- [ ] Screenshot – Analytics
- [ ] Server Logs (if applicable)
- [ ] Browser Console (if applicable)

---

## 9. Defect Log & Severity Definitions

**Severity Definitions:**
- **Critical:** Cannot create order, Cannot login, Payment failure. System unusable.
- **High:** Customer tracking incorrect, Chef workflow blocked, Core feature broken without workaround.
- **Medium:** Wrong UI data, Minor calculation issue, Workflow degraded but usable.
- **Low:** Styling, Minor wording, Cosmetic visual issues.

| ID | Severity | Module | Description | Status | Owner | Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | |
| | | | | | | |

---

## 10. Gate 2 Approval Criteria

Gate 2 is considered PASSED only if:
- [ ] Prerequisites & Environment Health all checked.
- [ ] Authentication, Sales, Kitchen, Delivery, and Tracking workflows all passed.
- [ ] Backend & Performance Verification passed.
- [ ] No Critical or High severity defects remain open.
- [ ] No unexpected frontend or backend runtime errors occurred.

### Exit Criteria
- [ ] All mandatory test cases executed.
- [ ] No Critical or High defects remain.
- [ ] All evidence attached.
- [ ] Tester and reviewer signatures completed.
- [ ] Release recommendation selected.

---

## 11. Post-Test Validation Summary & Risk Assessment

**Validation Summary:**
- **Total Tests:** _____
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____
- **Pass Rate:** _____ %

**Risk Assessment:**
| Risk | Status |
| :--- | :---: |
| Critical Risk | ☐ |
| High Risk | ☐ |
| Medium Risk | ☐ |
| Low Risk | ☐ |

---

## 12. Known Accepted Issues
*Issues logged below are considered low severity and will not block the release.*

| ID | Description | Justification |
| :--- | :--- | :--- |
| | | |
| | | |

---

## 13. Final Release Recommendation

Based on the evidence collected during this Gate 2 validation:

- [ ] **Approve Production Release:** Clean pass, ready for launch.
- [ ] **Approve With Known Low Issues:** Core workflow solid, minor UI/cosmetic issues accepted.
- [ ] **Hold Release:** Critical/High defects found. Return to development.
   - **Rollback Required?** ☐ Yes  ☐ No
   - **Reason:** _________________________________________________________________

**Decision Time:** ____________________
**Approved Build/Commit:** ____________________

**Overall Gate 2 Result:  ☐ PASS  ☐ FAIL**

**Tester Signature:** ______________________  **Date:** ________________

**Reviewer Signature:** ____________________  **Date:** ________________

---

## 14. Test Completion Checklist
- [ ] Evidence archived
- [ ] Logs archived
- [ ] Defects filed
- [ ] Release notes updated
- [ ] Stakeholders notified

---

## Release Workflow After Gate 2

Client UAT → Final Defect Review → Production Deployment

***

### Final Approval Decision

| Role | Name | Date | Signature / Decision |
| :--- | :--- | :--- | :--- |
| **QA Lead** | ______________ | ______________ | ✅ APPROVED FOR UAT |
| **Tech Lead** | ______________ | ______________ | ✅ BUILD FROZEN |
| **Product Owner**| ______________ | ______________ | ⏳ PENDING UAT |

## Environment Limitations & Exceptions (Local Testing)
The following integrations were intentionally bypassed during local execution and must be verified in the staging environment during Client UAT:
- Redis
- Cloudinary
- Razorpay
- Google Maps
- Notification Providers (SMS/Email)
- Background Jobs (Outbox Processor)

***

## Version Management Post-Gate 2
- **Build Status**: Release Candidate (RC)
- **Version**: `v1.1.0 RC`
- **Gate 2**: PASSED
- **Status**: FROZEN (Changes restricted to Critical/High bug fixes only. No feature development on this branch).

***

**End of Document**
