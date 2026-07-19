# Scope: Implementation Track

## Architecture
- **Tech Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase Client Auth & Database.
- **Client Pages**:
  - Customer login/signup page: `/customer/login`
  - Customer order history page: `/customer/orders`
  - Customer-facing homepage: `/` and public layouts
- **Auth Strategy**: Client-side Supabase Auth. Customer profiles will store phone numbers in user metadata. Orders are fetched from Supabase `orders` matching the user's phone number.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Customer Authentication | Supabase Auth signup, email/password login, and OTP (Magic Link) login on `/customer/login`. | None | REMEDIATION (f3fca7b7-8da6-42f2-92de-4cf932234f65) |
| 2 | Order History Page | Secure `/customer/orders` route displaying customer's active and past orders from DB matching their phone. | Milestone 1 | REMEDIATION (f3fca7b7-8da6-42f2-92de-4cf932234f65) |
| 3 | UI/UX Glassmorphism & Animations | Polish pages with glassmorphism CSS (`backdrop-filter: blur`), framer-motion animations on buttons/cart/modals. | None | PLANNED |
| 4 | SEO, Performance & Accessibility | Proper semantic HTML, meta descriptions, title tags, image/render optimizations. | None | PLANNED |
| 5 | E2E & Integrity Verification | Run Playwright test suite (once `TEST_READY.md` is published) and perform Forensic Audit. | Milestones 1-4 | PLANNED |

## Interface Contracts
- **Supabase Auth User Metadata**:
  - `name`: string
  - `phone`: string
- **Order Association**:
  - Orders queried from `orders` where `customerPhone` equals logged-in user's metadata phone.
