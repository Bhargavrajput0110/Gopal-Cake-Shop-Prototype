# Bakery OS v1.1.0 RC Release Notes

## Overview
This release finalizes the Core Engineering & Workflow features for Bakery OS, moving the system from development into production readiness. The primary focus of this release has been robust order lifecycle management, POS stability, and branch routing logic.

## Bug Fixes

- **Kitchen Event Subscriber (UAT-001):** Fixed a critical transition bug where Kitchen orders would silently fail to advance due to an `OrderStatus` vs `OrderItemStatus` domain mismatch (`COMPLETED` vs `READY_FOR_PICKUP`). The parent order now successfully advances once all items reach `READY_FOR_PICKUP`.
- **Sales Dashboard Data Contract (UAT-002):** Resolved a critical crash caused by a frontend/backend contract drift. Added the missing `orderNumber` type definition to the `Order` interfaces to ensure full type alignment with Prisma schemas and API DTOs.
- **Branch Identifier Alignment:** Corrected an inconsistent branch identifier reference in the Sales Orders module to use the canonical "Warasiya" branch identifier. This ensures consistent branch-specific routing and behavior across the Sales Orders workflow.

## Deferred / Known Issues (v1.2 Backlog)

- **Mobile Delivery Button Ergonomics (UAT-003):** The "Mark as Delivered" touch target on mobile devices requires precision. Scheduled for improvement in v1.2 (increasing touch target area and improving spacing/confirmation flows to prevent accidental destructive actions).
