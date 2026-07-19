# ADR-002: Forward-Only Database Migrations

## Status
Accepted (v1.0.0)

## Context
During CI/CD deployments and application rollbacks, reverting the application code is straightforward via Vercel/Railway platform rollbacks. However, reverting a database schema (especially when data has been written to new columns) often results in catastrophic data loss. Prisma does not natively support an automated "down" migration.

## Decision
We enforce a strict policy of **Forward-Only Migrations**.
- Reverting database changes by running `migrate down` or manually dropping tables is explicitly forbidden in production.
- If a schema change causes a bug, the application code is rolled back first. Then, a new forward-moving Prisma migration is written to gracefully deprecate, ignore, or transition the problematic schema element without dropping historical data.

## Consequences
- **Positive**: Zero data-loss guarantee during incident response and rollbacks.
- **Positive**: CI/CD pipelines remain simple (`prisma migrate deploy`).
- **Negative**: The database schema may accumulate deprecated "ghost" columns over time that must be ignored by the application.
