# ADR-005: Deployment Target (Railway / Docker)

## Status
Accepted (v1.0.0)

## Context
The application was originally prototyped using Vercel Serverless Functions. However, Vercel's Edge/Serverless constraints (such as connection pooling limitations, lack of native background workers, and strict timeout limits) do not align well with a traditional, stateful ERP system that requires background outbox processing, long-running reports, and predictable database connections.

## Decision
We elected to transition the primary deployment target to **Railway / DigitalOcean App Platform / Docker**.
- The Next.js application will be built as a standalone Node.js Docker container (`output: 'standalone'`).
- This allows for persistent background workers, eliminates serverless cold starts for critical POS paths, and standardizes the deployment environment across any cloud provider.

## Consequences
- **Positive**: Vendor lock-in is completely eliminated. The system can be self-hosted on a VPS or deployed to managed container platforms.
- **Positive**: Simplified database connection pooling without relying on external proxies specifically tailored for Serverless constraints.
- **Negative**: The operations team is now responsible for container scaling, memory management, and baseline infrastructure monitoring compared to a purely managed Serverless environment.
