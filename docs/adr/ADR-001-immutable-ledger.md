# ADR-001: Immutable Ledger for Financial Records

## Status
Accepted (v1.0.0)

## Context
Bakery OS handles financial transactions including payments, cash collection by drivers, vendor payouts, and branch transfers. Initially, order balances and payment statuses were tracked via mutable fields on the `Order` or `Payment` tables. This led to difficulty in resolving accounting discrepancies, calculating daily cash out totals, and tracking refunds or waivers.

## Decision
We decided to adopt an **Immutable Ledger** architecture. 
- A `LedgerEntry` table was created as an append-only log of financial events.
- Balances are no longer updated via direct `UPDATE` queries; instead, they are derived by aggregating `LedgerEntry` rows.
- Every financial mutation requires a `credit` and `debit` entry tied to a specific account type (e.g., `CASH`, `BANK`, `CUSTOMER`, `VENDOR`).

## Consequences
- **Positive**: Absolute auditability. Financial discrepancies can be traced row-by-row.
- **Positive**: Simplifies end-of-day reconciliation for branch managers.
- **Negative**: Requires slightly more complex querying (`SUM()`) to calculate current balances, though this is mitigated by database indexing.
