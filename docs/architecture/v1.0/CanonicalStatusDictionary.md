# Canonical Status Dictionary

This document defines the single source of truth for entity statuses. Modules must use these exact states to prevent logic drift.

## Order Status
- `NEW`: Order created, awaiting sales approval.
- `APPROVED`: Order approved, sent to kitchen queue.
- `CHEF_ACCEPTED`: Chef claimed the ticket.
- `MAKING`: Prep/Baking in progress.
- `DECORATING`: Finishing stage.
- `QC_PENDING`: Ready for quality inspection.
- `QC_PASSED`: Quality checklist complete.
- `PACKED`: Boxed and staged.
- `READY_FOR_PICKUP`: Waiting for driver or customer.
- `OUT_FOR_DELIVERY`: Driver has left the bakery.
- `DELIVERED`: Handed over to customer.
- `COMPLETED`: Lifecycle finished.
- `CANCELLED`: Voided.

## Payment Status
- `PENDING`: Payment expected but not received.
- `PARTIAL`: Advance paid, balance pending.
- `COMPLETED`: Fully paid.
- `FAILED`: Transaction rejected by gateway.
- `REFUNDED`: Fully or partially refunded.

## Delivery Status
- `UNASSIGNED`: Waiting for a driver.
- `ASSIGNED`: Driver claimed the job.
- `IN_TRANSIT`: En route.
- `DELIVERED`: Handed over.
- `FAILED`: Customer unavailable/rejected.

## Inventory Status
- `IN_STOCK`: Available for sale.
- `LOW_STOCK`: Below threshold.
- `SOLD_OUT`: Unavailable for sale.

## Notification Status
- `QUEUED`: Waiting to be sent.
- `SENT`: Successfully dispatched to provider.
- `DELIVERED`: Confirmed receipt by end-user (WhatsApp only).
- `FAILED`: Dispatch error.
