# Bakery OS - Production Operations Runbook

## 1. Prerequisites & Environment Setup

Before deploying the application to the production server, verify that the following external services are provisioned and accessible:

- **PostgreSQL Database** (e.g., Supabase, Neon, AWS RDS).
- **Redis Instance** (e.g., Upstash) for rate-limiting.
- **Razorpay Account** (Live Mode) for payments.
- **Cloudinary Account** for image storage.
- **Google Maps API Key** (Distance Matrix API enabled).

### Required Environment Variables
The application will fail to start if these are missing:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_a_random_secure_string

RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

DISTANCE_PROVIDER=google
GOOGLE_MAPS_API_KEY=AIza...

UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
CLOUDINARY_URL=cloudinary://...

CRON_SECRET=generate_a_random_secure_string
```

## 2. Deployment Procedures

### Database Migration Strategy
**NEVER run `npx prisma db push` in production.** 
Schema drift or data loss can occur.

Always use:
```bash
npx prisma migrate deploy
```
*Note: The `package.json` build script is already configured to run `migrate deploy` automatically before `next build`.*

### Data Migration
If a schema change requires modifying existing table data:
1. Write an idempotent Node.js script in `scripts/data-migrations/`.
2. Run `migrate deploy`.
3. Execute the data migration script before starting the web server.
4. Verify data integrity.

## 3. Background Jobs (Cron)
The system relies on background reconciliation to cancel abandoned checkouts. 

Configure your hosting platform (Vercel Cron, Railway Cron, or a system `crontab`) to hit these endpoints every 5-15 minutes using the `CRON_SECRET`:

- **Outbox Processor:** `POST /api/v1/cron/outbox`
- **Payment Reconciliation:** `POST /api/v1/jobs/reconcile-payments`

Headers required:
`Authorization: Bearer <CRON_SECRET>`

## 4. Disaster Recovery & Rollback

### Rollback Strategy
1. **Application Code:** Revert the Git commit and redeploy the previous Docker image / Vercel deployment.
2. **Database Schema:** Prisma does not natively support "down" migrations automatically. To roll back a database schema, you must create a new migration that reverses the changes, and deploy it forward. 
   - `npx prisma migrate dev --name rollback_feature`

### Database Backups
- Ensure Automated Backups are enabled on the Database Provider with at least a 7-day retention period.
- Point-in-Time Recovery (PITR) is highly recommended.

## 5. Health Monitoring
Ping the health endpoint to monitor provider status:
```http
GET https://your-domain.com/api/v1/health/deep
```

**Expected responses:**
- `HTTP 200` — All configured services (DB, Redis, Cloudinary, Razorpay, Maps) are healthy and reachable.
- `HTTP 503` — One or more dependencies are unavailable or misconfigured. Check the response body for which service failed.

Configure your uptime monitor or alerting system to trigger on any non-200 response from this endpoint.

