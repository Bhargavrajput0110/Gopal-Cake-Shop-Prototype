# Bakery OS v1.1.0 RC Release Notes

| Field | Value |
|------|------|
| Version | v1.1.0 RC |
| Status | Approved for Production Deployment |
| Release Date | 2026-07-26 |
| Environment | Production |
| Git Branch | main |
| Previous Version | v1.0.x |
| Next Planned Version | v1.2.0 |

## Overview

This release finalizes the core engineering and operational workflows for Bakery OS v1.1.0 RC, marking the transition from development to production readiness. The primary focus of this release is improving order lifecycle reliability, point-of-sale stability, and branch-specific routing to support day-to-day bakery operations.

## Bug Fixes

### UAT-001 — Kitchen Event Subscriber
Fixed a critical workflow issue where kitchen orders could fail to advance after all items were prepared due to an `OrderStatus` and `OrderItemStatus` domain mismatch (`COMPLETED` vs. `READY_FOR_PICKUP`). The parent order now transitions correctly once all order items reach the `READY_FOR_PICKUP` state.

### UAT-002 — Sales Dashboard Data Contract
Resolved a critical frontend/backend contract mismatch that caused the Sales Dashboard to fail when rendering order history. Added the missing `orderNumber` property to the frontend `Order` interfaces, restoring alignment with the backend API and Prisma data model.

### Branch Identifier Alignment
Corrected an inconsistent branch identifier reference within the Sales Orders module to use the canonical "Warasiya" branch identifier, ensuring consistent branch-specific routing and behavior.

## Verification

The following verification activities were completed prior to release approval:

- TypeScript compilation completed successfully with zero errors.
- Manual regression testing completed for the Kitchen workflow.
- Manual regression testing completed for the Sales Dashboard order history.
- Backend/frontend data contract verified.

## Deferred Enhancements / Known Issues

### UAT-003 — Mobile Delivery Workflow
The "Mark as Delivered" action on mobile devices currently has a touch target that can be difficult to use accurately. 

**Status:** Deferred by release decision.

**Reason:** The issue affects usability but does not impact functional correctness or production stability. It has been accepted into the v1.2 backlog.

This improvement has been scheduled for v1.2 and will include:
- Larger touch target for the primary action
- Improved spacing between primary and destructive actions
- Review of confirmation flow for destructive actions to reduce accidental taps

## Release Summary

### Release Status
- **Version:** v1.1.0 RC
- **Status:** Approved for Production Deployment (pending final production readiness verification)

### UAT Results
- **Total Findings:** 3
- **Critical:** 2 (Resolved)
- **High:** 0
- **Medium:** 1 (Deferred to v1.2)
- **Low:** 0

### Scope
**Included:**
- Kitchen Workflow
- Sales Dashboard
- Order Lifecycle
- Branch Routing
- POS Stability

**Excluded:**
- Dynamic Pricing remains under active development on its dedicated feature branch and is intentionally excluded from the v1.1.0 RC release scope.
- Mobile Delivery UX improvements (v1.2)
