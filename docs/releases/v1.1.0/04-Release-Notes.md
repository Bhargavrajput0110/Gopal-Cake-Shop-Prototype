# Bakery OS v1.1.0 RC Release Notes

## Overview

This release finalizes the core engineering and operational workflows for Bakery OS v1.1.0 RC, marking the transition from development to production readiness. The primary focus of this release is improving order lifecycle reliability, point-of-sale stability, and branch-specific routing to support day-to-day bakery operations.

## Bug Fixes

### UAT-001 — Kitchen Event Subscriber
Fixed a critical workflow issue where kitchen orders could fail to advance after all items were prepared due to an `OrderStatus` and `OrderItemStatus` domain mismatch (`COMPLETED` vs. `READY_FOR_PICKUP`). The parent order now transitions correctly once all order items reach the `READY_FOR_PICKUP` state.

### UAT-002 — Sales Dashboard Data Contract
Resolved a critical frontend/backend contract mismatch that caused the Sales Dashboard to fail when rendering order history. Added the missing `orderNumber` property to the frontend `Order` interfaces, restoring alignment with the backend API and Prisma data model.

### Branch Identifier Alignment
Corrected an inconsistent branch identifier reference within the Sales Orders module to use the canonical "Warasiya" branch identifier, ensuring consistent branch-specific routing and behavior.

## Deferred Enhancements / Known Issues

### UAT-003 — Mobile Delivery Workflow
The "Mark as Delivered" action on mobile devices currently has a touch target that can be difficult to use accurately. This improvement has been scheduled for v1.2 and will include:
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

**Deferred:**
- Mobile Delivery UX improvements (v1.2)
- Dynamic Pricing (feature branch only)
