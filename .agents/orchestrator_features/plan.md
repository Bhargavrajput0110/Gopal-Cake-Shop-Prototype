# plan.md - Gopal Cake Shop Feature Upgrade

## Architecture
- **Tech Stack**: Next.js 16 (App Router), TypeScript, Prisma Client, Supabase (PostgreSQL), Recharts, next-pwa.
- **Data Flow**:
  - Reviews: Logged-in customer submits review via order history page -> API -> DB. Product detail pages load reviews. Admin moderates reviews.
  - Push Notifications: Customer subscribes to push notifications -> subscription saved in DB linked to customer/order. Order status changes -> trigger push server payload to browser via service worker.
  - Analytics: `/admin` page fetches real order data and renders Line, Bar, and Donut charts.
  - PDF Invoices: Clicking "Download Invoice" on `/order/[id]` or customer orders page generates PDF on client/server and triggers download.
  - Product Detail Pages: Dynamic route `/product/[slug]` loads category details, description, allergens, reviews, and links to `/custom` with pre-filled inputs.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | DB Schema & Seed | Update Prisma schema to add `Review` and `PushSubscription` models. Seed at least 6 products with category/slug info. | None | PLANNED |
| 2 | Backend APIs & SW | Implement Reviews CRUD API, Push Notification subscription API, push status notification sender, and PDF Invoice generation API. Register PWA Service Worker. | Milestone 1 | PLANNED |
| 3 | Product Pages & Reviews | Create `/product/[slug]` detail page with full gallery, description, ingredients, rating, and "Order This Cake" CTA. Add review submission UI to Order History page. | Milestone 2 | PLANNED |
| 4 | Admin Analytics & Moderation | Expand `/admin` with 3 charts using real data and add Review Moderation UI. | Milestone 2 | PLANNED |
| 5 | E2E Testing & Verification | Write Playwright tests for review submission, PDF download, analytics render. Verify the entire application passes Next.js build. Run Forensic Audit. | Milestones 3, 4 | PLANNED |

## Interface Contracts
- **Review Submission (`POST /api/reviews`)**:
  - Payload: `{ orderId: string, productId: string, rating: number, comment: string }`
  - Response: `{ success: boolean, review: Review }`
- **Push Subscription (`POST /api/notifications/subscribe`)**:
  - Payload: `{ orderId: string, subscription: any }`
  - Response: `{ success: boolean }`
- **Invoice Download (`GET /api/orders/[id]/invoice`)**:
  - Response: PDF binary stream or generated JSON/HTML for browser-side PDF print.
