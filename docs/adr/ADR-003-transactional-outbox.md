# ADR-003: Transactional Outbox Pattern

## Status
Accepted (v1.0.0)

## Context
Bakery OS relies heavily on sending notifications (In-App, WhatsApp, Push) when critical business events occur (e.g., Order Created, Transfer Dispatched). Initially, notifications were dispatched synchronously inline within the API routes. This caused slow API response times and resulted in a dual-write problem: if the database transaction succeeded but the WhatsApp API timed out, the system was left in an inconsistent state.

## Decision
We adopted the **Transactional Outbox Pattern**.
- All business operations (e.g., `OrderService.checkout`) write their changes AND an `Outbox` record within the exact same `prisma.$transaction`.
- A background cron job (`/api/v1/cron/outbox`) independently polls the `Outbox` table and dispatches the actual notifications.

## Consequences
- **Positive**: API routes respond instantly without waiting for slow third-party providers.
- **Positive**: Guarantees consistency. If the DB commits, the notification is guaranteed to be enqueued; if it rolls back, the notification is never sent.
- **Positive**: Built-in retry mechanism for failed third-party API calls.
- **Negative**: Introduces slight asynchronous latency between an action occurring and a notification being received (usually < 1 minute).
