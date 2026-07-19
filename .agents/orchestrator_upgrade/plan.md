# Project Upgrade Plan: Customer Auth, Glassmorphism, Playwright Testing, & SEO/Perf

## Architecture
- **Tech Stack**: Next.js 16 (App Router), TS, Tailwind CSS, Framer Motion, Prisma, PostgreSQL (via Supabase client), Supabase Auth.
- **Client Auth**: Supabase Auth client to manage signup/login sessions (Email/Password, Magic Link).
- **Checkout Flow**: Homepage product selection -> Add to Cart -> Checkout page form submission -> Order creation.
- **Testing**: Playwright test suite for end-to-end user checkout flow verification.
- **UI/UX**: Tailwind classes, CSS custom properties, and backdrop-filter for glassmorphism. Framer Motion for micro-animations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | E2E Testing Setup & Suite | Install Playwright, configure E2E testing framework, design test cases, and write E2E test cases (Tier 1-4). Publish `TEST_READY.md`. | None | IN_PROGRESS |
| M2 | Customer Auth & Order History | Implement Supabase Auth signup/login flow (Email/Password, Magic Link), create the Order History page. | None | IN_PROGRESS |
| M3 | UI/UX Polish & Glassmorphism | Apply backdrop-filter: blur, add Framer Motion micro-animations (buttons, Cart, modals). | None | IN_PROGRESS |
| M4 | SEO, Performance & Accessibility | Implement proper semantic HTML, meta tags (title, description), and optimization of image/rendering performance. | None | IN_PROGRESS |
| M5 | E2E Integration, Hardening & Audit | Integrate all changes, run E2E test suite to verify 100% success, perform Forensic Audit. | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Supabase Auth Client Integration
- Sign Up: `supabase.auth.signUp({ email, password })`
- Sign In: `supabase.auth.signInWithPassword({ email, password })`
- Magic Link: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`
- Session hook: `useSession()` / `supabase.auth.onAuthStateChange` to track current user.
- Protected Order History page at `/orders` or `/customer/orders` (redirect to login if unauthenticated).

### SEO Page Meta Configuration
- Each customer-facing page must export a `metadata` object or contain custom title/meta tags in Next.js:
  ```typescript
  export const metadata = {
    title: 'Gopal Cake Shop | Delicious Cakes',
    description: 'Order custom cakes online from Gopal Cake Shop. Fresh, delicious, and delivered to your doorstep.',
  }
  ```
