# Known Limitations (v1.0.0)

This document explicitly tracks unfinished business features, technical debt, and current constraints of the system so they are not forgotten as development continues.

## Technical Limitations
1. **Supabase Auth Mocking in Integration Tests**: The Real PostgreSQL Integration Suite still relies on mocked Supabase JWT verification (`createServerClient` mock) in `vitest`. A future improvement is to seed a local Supabase Auth container or use a service key to bypass JWT mocks entirely for a 100% end-to-end integration environment.
2. **Sequential Real DB Test Execution**: `Transactions.test.ts` drops/truncates tables on each run and must be executed without Vitest concurrency (`--poolOptions.threads.singleThread=true` equivalent) to prevent database deadlocks.
3. **PWA Offline Support**: While a Service Worker is installed, full offline mutation sync (e.g., placing an order without an internet connection) is not implemented.

## Deferred Business Features
1. **Internal Staff Notifications**: Currently, there is no in-app notification center for staff. Communication happens purely out-of-band.
2. **WhatsApp Integration**: Automated SMS/WhatsApp notifications to customers regarding their order status are not yet implemented.
3. **Advanced Cloudinary Workflows**: Basic image paths are supported in the database, but full Cloudinary integration for variant generation, automatic compression, and an admin media gallery is pending v1.1.0.
4. **Unified Manual Order Engine**: The POS checkout logic currently has some duplication with the public customer checkout flow. In v1.1.0, the Sales Dashboard will embed the public storefront engine directly to unify business rules.
