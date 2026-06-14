# GOPAL CAKE SHOP — PWA SPEC
> GSD-style Spec-Driven Development Document  
> Version: 1.0 | Status: Active | Last Updated: 2026-06-14
> 
> **READ THIS FIRST:** This document is the single source of truth for the entire project.  
> Any AI model, any session, any developer — start here. Never hallucinate. Never guess.  
> If something is not in this spec, ask before building.

---

## PROJECT OVERVIEW

**What:** A Progressive Web App (PWA) for Gopal Cake Shop — a full ERP + customer-facing order system.  
**Who:** Internal staff (Sales, Chef, Delivery, Admin). Customers are anonymous — no accounts.  
**Where:** Hosted on Hostinger KVM 2 VPS (Ubuntu 24.04, Mumbai), managed by Coolify  
**Stack:** Next.js 16 (App Router) + Supabase (PostgreSQL + Auth + Realtime + Storage) + Redis  
**Customer Communication:** 100% via WhatsApp. No in-app chat for customers. Staff can call or WhatsApp the customer directly from within the app using the phone number on the order.

---

## ROLES & ACCESS

| Role | Access | Notes |
|---|---|---|
| `admin` | Everything | Full system, all branches |
| `sales` | Sales dashboard + order creation + messaging | Branch-scoped |
| `chef` | Chef KDS (Kitchen Display System) only | Branch-scoped |
| `delivery` | Delivery dashboard only | Branch-scoped |

> **DECISION LOCKED:** Customers do NOT have accounts or login.  
> They receive a **public shareable tracking link** (e.g. `gopalkakeshop.com/track/ORD-1001`).  
> No authentication needed. No customer data stored beyond what's in the order itself.

---

## TECH STACK (LOCKED — DO NOT CHANGE)

```
Frontend:     Next.js 16 (App Router, TypeScript, Tailwind CSS)
Database:     PostgreSQL 16 via Supabase (self-hosted on VPS)
Auth:         Supabase Auth (email/password for staff, phone OTP for customers)
Realtime:     Supabase Realtime Channels (websockets)
Storage:      Supabase Storage (delivery photos, priority order images)
Cache:        Redis (session cache, rate limiting)
Deploy:       Coolify on Hostinger KVM 2 VPS (Mumbai)
PWA:          next-pwa (service worker, manifest, offline page)
UI Library:   Existing components (iconsax-react, framer-motion, lucide-react)
```

---

## ROUTES MAP

```
PUBLIC (no login required)
  /                          → Customer-facing homepage
  /track/[orderId]           → Order tracking page — public link sent via WhatsApp/SMS
  /login                     → Staff login page ONLY

⛔ NO customer login. NO /my-orders. NO customer accounts.
   Customers are identified only by phone number stored on the order.

SALES (role: sales)
  /sales                     → Command center dashboard
  /sales/orders              → All orders list
  /sales/manual              → Create new order (POS)
  /sales/payments            → Payment tracking
  /sales/delivery            → Delivery assignment
  /sales/transfers           → Branch transfers
  /sales/vendors             → Vendor orders
  /sales/messages            → Internal staff chat ONLY (Sales ↔ Chef, Sales ↔ Driver)

CHEF (role: chef)
  /chef                      → Kitchen Display System (KDS)

DELIVERY (role: delivery)
  /delivery                  → Delivery driver dashboard

ADMIN (role: admin)
  /admin                     → Admin overview
  /admin/orders              → All orders, all branches
  /admin/staff               → Staff management
  /admin/menu                → Menu/product management
  /admin/reports             → Revenue reports
  /admin/settings            → System settings
```

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

### Table: `profiles`
```sql
id            uuid PRIMARY KEY REFERENCES auth.users
full_name     text NOT NULL
phone         text
role          text CHECK (role IN ('admin','sales','chef','delivery'))  -- NO customer role
branch_id     uuid REFERENCES branches
avatar_url    text
fcm_token     text        -- push notification token (future)
is_active     boolean DEFAULT true
created_at    timestamptz DEFAULT now()

-- NOTE: Customers are NOT in this table. Customer info lives only on the order record.
-- customer_name and customer_phone are plain text columns on the orders table.
```

### Table: `branches`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
address       text
city          text DEFAULT 'Vadodara'
is_active     boolean DEFAULT true
created_at    timestamptz DEFAULT now()
```

### Table: `orders`
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_number          text UNIQUE NOT NULL   -- e.g. 100001 (1 = branch, 00001 = order)
customer_name         text NOT NULL          -- plain text, no account needed
customer_phone        text NOT NULL          -- plain text, used for WhatsApp tracking link
tracking_token        text UNIQUE            -- random token for /track/[token] public URL
branch_id             uuid REFERENCES branches
status                text CHECK (status IN (
                        'new','accepted_by_chef','preparing','decorating',
                        'ready_for_pickup','pending_assignment','assigned_to_driver',
                        'picked_up_by_driver','on_the_way','delivered',
                        'cancelled','failed'))
is_priority           boolean DEFAULT false
is_surprise           boolean DEFAULT false
is_vip                boolean DEFAULT false
delay_level           text CHECK (delay_level IN ('none','warning','delayed')) DEFAULT 'none'
total_amount          numeric(10,2) NOT NULL
advance_paid          numeric(10,2) DEFAULT 0
pending_balance       numeric(10,2) DEFAULT 0
delivery_address      text
time_target           timestamptz NOT NULL
assigned_chef_id      uuid REFERENCES profiles
assigned_driver_id    uuid REFERENCES profiles
production_start_time timestamptz
priority_reason       text
notes                 text
created_by            uuid REFERENCES profiles  -- sales staff who created
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### Table: `order_items`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id      uuid REFERENCES orders ON DELETE CASCADE
product_name  text NOT NULL
qty           integer NOT NULL DEFAULT 1
unit_price    numeric(10,2)
notes         text            -- special instructions
created_at    timestamptz DEFAULT now()
```

### Table: `order_images`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id      uuid REFERENCES orders ON DELETE CASCADE
storage_path  text NOT NULL   -- path in Supabase Storage
image_type    text CHECK (image_type IN ('reference','proof_of_delivery'))
uploaded_by   uuid REFERENCES profiles
expires_at    timestamptz     -- 30 days for reference, 30 days for POD
created_at    timestamptz DEFAULT now()
```

### Table: `conversations`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
type          text CHECK (type IN ('customer_support','internal','order_thread'))
order_id      uuid REFERENCES orders   -- nullable
title         text
created_at    timestamptz DEFAULT now()
```

### Table: `conversation_participants`
```sql
conversation_id   uuid REFERENCES conversations ON DELETE CASCADE
user_id           uuid REFERENCES profiles
last_read_at      timestamptz DEFAULT now()
PRIMARY KEY (conversation_id, user_id)
```

### Table: `messages`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id   uuid REFERENCES conversations ON DELETE CASCADE
sender_id         uuid REFERENCES profiles
content           text
message_type      text CHECK (message_type IN ('text','image','system_event')) DEFAULT 'text'
metadata          jsonb       -- for system_event: { event: 'status_changed', from: 'preparing', to: 'ready' }
is_deleted        boolean DEFAULT false
created_at        timestamptz DEFAULT now()
```

### Table: `notifications`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES profiles
type          text NOT NULL   -- 'order_status_changed','new_message','payment_due','issue_reported'
title         text NOT NULL
body          text
data          jsonb           -- { order_id, status, etc. }
is_read       boolean DEFAULT false
created_at    timestamptz DEFAULT now()
```

### Table: `issues`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id      uuid REFERENCES orders
reported_by   uuid REFERENCES profiles
issue_type    text            -- 'ingredient_missing','equipment_fault','other'
severity      text CHECK (severity IN ('normal','urgent')) DEFAULT 'normal'
notes         text
resolved      boolean DEFAULT false
resolved_by   uuid REFERENCES profiles
created_at    timestamptz DEFAULT now()
```

### Table: `products`
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
category      text            -- 'cake','pastry','cupcake','custom'
base_price    numeric(10,2)
description   text
image_url     text
is_available  boolean DEFAULT true
branch_id     uuid REFERENCES branches   -- null = available at all branches
created_at    timestamptz DEFAULT now()
```

---

## ROW LEVEL SECURITY RULES

```
orders:
  SELECT: public can read via tracking_token (for /track page) | sales/chef/delivery sees branch | admin sees all
  INSERT: sales + admin only
  UPDATE: sales (most fields) | chef (status: accepting/producing) | delivery (delivery statuses) | admin (all)
  NOTE: No customer RLS — customers use a public token URL, not auth

messages:
  SELECT: only staff participants (no customer accounts)
  INSERT: sales + admin only (staff initiate, not customers)

notifications:
  SELECT/UPDATE: staff user sees only own

issues:
  INSERT: chef only
  SELECT: chef (own) + sales + admin
  UPDATE: sales + admin (mark resolved)

profiles:
  SELECT: authenticated staff see own | admin sees all
  UPDATE: own profile only | admin can update any
  NOTE: Only staff have profiles. No customer profiles table needed.
```

---

## CURRENT STATE (What's Already Built — Frontend Only)

### ✅ COMPLETED PAGES (UI ONLY — no real database yet)

#### Customer Side
- [x] `/` — Homepage with hero, categories, featured products, bento grid
- [x] Custom cursor, preloader, film grain overlay, animations

#### Sales Dashboard (`/sales/*`)
- [x] Layout with sidebar + header
- [x] `/sales` — Command center with KPI cards, financial overview
- [x] `/sales/orders` — Orders list
- [x] `/sales/manual` — Manual order creation form WITH priority image upload (images stored 30 days)
- [x] `/sales/payments` — Payment tracking
- [x] `/sales/delivery` — Delivery assignment
- [x] `/sales/transfers` — Branch transfers
- [x] `/sales/vendors` — Vendor orders

#### Chef KDS (`/chef`)
- [x] 3-column Kanban (Incoming | My Production | Ready)
- [x] Accept & Start Baking + Reject buttons (Incoming column)
- [x] Single checkbox + "Ready for Dispatch" button (Production column)
- [x] "Report Missing Ingredient" banner button → calls reportIssue()
- [x] Countdown timers, production timers, priority badges, VIP badges

#### Delivery Dashboard (`/delivery`)
- [x] 3-column layout (Open Pool | My Queue | Dashboard)
- [x] Accept job, pickup, start delivery, deliver + collect money flow
- [x] POD (Proof of Delivery) modal with camera + e-signature placeholders
- [x] Financial KPI cards

#### Admin (`/admin`)
- [x] Basic layout

### ⚠️ IMPORTANT: All data is currently FAKE
- All orders come from `OrderContext.tsx` with hardcoded `INITIAL_ORDERS` array
- No real database connection exists yet
- All status changes only update in-memory React state
- Images in priority orders are only previewed locally, not uploaded anywhere

---

## WHAT STILL NEEDS TO BE BUILT

### PHASE 1 — REMAINING FRONTEND (Complete UI before any backend)

#### 1.1 Missing Forms & Pages
- [ ] **Login page** (`/login`) — email/password for STAFF ONLY (admin, sales, chef, delivery)
- [ ] **Admin Panel** — Full redesign:
  - [ ] `/admin` — dashboard with branch-wide KPIs
  - [ ] `/admin/orders` — all orders with filters + edit capability
  - [ ] `/admin/staff` — add/edit/deactivate staff accounts + assign roles
  - [ ] `/admin/menu` — add/edit/delete products with images
  - [ ] `/admin/reports` — revenue charts, order volume, delivery performance
  - [ ] `/admin/settings` — branch settings, working hours, etc.
- [ ] **Customer Order Tracking** (`/track/[token]`) — **PUBLIC page, no login**, shows order status timeline + estimated time. Link is sent via WhatsApp after order creation.
- [ ] **Messaging UI** (`/sales/messages`) — internal staff chat only (Sales ↔ Chef, Sales ↔ Driver)
- [ ] **Notification Bell** — dropdown showing unread notifications (header component for staff)

#### 1.2 Incomplete Existing Pages
- [ ] **Sales Manual Order form** — wire "Send to Kitchen" button to actually create an order
- [ ] **Sales Orders page** — add create + edit order modal/drawer
- [ ] **Admin dashboard** — complete redesign

#### 1.3 PWA Setup
- [ ] `next-pwa` installation and configuration
- [ ] `manifest.json` (app name, icons, theme color)
- [ ] Offline fallback page
- [ ] "Add to Home Screen" prompt component
- [ ] Service worker for static asset caching

---

### PHASE 2 — BACKEND & DATABASE

#### 2.1 Supabase Setup
- [ ] Create Supabase project (self-hosted on VPS OR Supabase Cloud for dev)
- [ ] Run all table migrations (schema above)
- [ ] Enable Row Level Security on all tables
- [ ] Write RLS policies per the rules above
- [ ] Seed database with realistic test data

#### 2.2 Authentication
- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Create Supabase client (server + client + middleware)
- [ ] Login page wired to Supabase Auth
- [ ] Role-based middleware — redirect to correct dashboard after login
- [ ] Session management (refresh tokens, protected routes)

#### 2.3 Replace Fake Data with Real Queries
- [ ] Delete `OrderContext.tsx` fake data
- [ ] Create `lib/supabase/orders.ts` — all order CRUD functions
- [ ] Create `lib/supabase/profiles.ts` — user profile functions
- [ ] Create `lib/supabase/messages.ts` — conversation + message functions
- [ ] Create `lib/supabase/notifications.ts` — notification functions
- [ ] Wire all existing UI components to real Supabase queries

#### 2.4 Realtime Subscriptions
- [ ] Chef KDS — live order updates (new orders appear without refresh)
- [ ] Sales dashboard — live KPI updates
- [ ] Delivery dashboard — live job pool updates
- [ ] Notification bell — live unread count

#### 2.5 File Storage
- [ ] Configure Supabase Storage buckets:
  - `priority-order-images` (30-day auto-expiry)
  - `proof-of-delivery` (30-day auto-expiry)
- [ ] Wire priority order image upload in `/sales/manual`
- [ ] Wire POD photo capture in `/delivery`
- [ ] Set up storage cleanup cron job (delete expired files)

#### 2.6 API Routes (Next.js Server Actions / Route Handlers)
- [ ] `POST /api/orders` — create new order
- [ ] `PATCH /api/orders/[id]/status` — update order status
- [ ] `POST /api/orders/[id]/issues` — report kitchen issue
- [ ] `POST /api/messages` — send message
- [ ] `GET /api/notifications` — fetch user notifications
- [ ] `PATCH /api/notifications/[id]/read` — mark notification read

---

### PHASE 3 — NOTIFICATIONS & MESSAGING

#### 3.1 In-App Notifications (Staff Only)
- [ ] Notification bell component wired to live DB
- [ ] Notification dropdown UI (unread count, mark all read)
- [ ] Auto-insert notification rows on key events:
  - New order created → notify chef + sales
  - Order status changed → notify sales + admin
  - Issue reported → notify sales + admin
  - New message → notify recipient staff member
  - Payment pending → notify delivery driver

#### 3.2 Customer Communication — WhatsApp ONLY
> Customers are NOT notified through the app. All customer-facing communication is via WhatsApp.

**Auto WhatsApp messages triggered on these events:**
- [ ] Order confirmed → send tracking link: `"Your order #{order_number} is confirmed! Track it: gopalkakeshop.com/track/{token}"`
- [ ] Chef starts baking → `"Your order is now being prepared 🎂"`
- [ ] Order ready for pickup → `"Your order is ready! Please collect it from the store."`
- [ ] Driver assigned + picked up → `"Your order is on the way! Driver: {name}, Contact: {phone}"`
- [ ] Delivered + COD → `"Delivered! Pending balance: ₹{amount}. Thank you!"`
- [ ] Order delayed → `"We're running a little late. New estimated time: {time}. Sorry for the wait!"`

**WhatsApp Implementation:** Use `wa.me` deep links. No WhatsApp Business API needed for now.
```
https://wa.me/91{customer_phone}?text={encoded_message}
```
This opens WhatsApp on the sales staff's phone with the pre-filled message. Staff hits Send.

**Staff Quick-Action buttons on every order card:**
- [ ] 📞 **Call** button → `tel:{customer_phone}` (opens dialler)
- [ ] 💬 **WhatsApp** button → `wa.me` link with context-aware pre-filled message
- [ ] These buttons appear on: sales order cards, delivery order cards

#### 3.3 Internal Messaging System (Staff Only)
- [ ] Internal: Sales ↔ Chef (linked to order)
- [ ] Internal: Sales ↔ Driver (linked to order)
- [ ] Message read receipts
- [ ] System messages (auto-inserted when order status changes)
- [ ] ⛔ NO customer chat inside the app — WhatsApp handles all customer comms

#### 3.4 Push Notifications Infrastructure (Wire Later)
- [ ] Web Push API subscription flow on staff login
- [ ] Save `fcm_token` to `profiles` table
- [ ] Supabase Edge Function stub for sending push to staff
- [ ] Note: Actual push delivery wired after production launch

---

### PHASE 4 — PRODUCTION DEPLOY

#### 4.1 VPS Setup
- [ ] Buy Hostinger KVM 2 (Mumbai, Ubuntu 24.04 + Coolify template)
- [ ] SSH access setup + basic firewall (ufw)
- [ ] Install Coolify on VPS
- [ ] Install PostgreSQL 16 + Redis on VPS

#### 4.2 Supabase Self-Hosted
- [ ] Deploy Supabase stack via Docker Compose on VPS
- [ ] Configure SSL for Supabase API endpoint
- [ ] Run all migrations on production DB
- [ ] Seed production data (branches, admin account)

#### 4.3 App Deployment
- [ ] Connect GitHub repo to Coolify
- [ ] Configure environment variables in Coolify
- [ ] Set `output: 'standalone'` in `next.config.js`
- [ ] Configure domain + SSL (Let's Encrypt via Coolify)
- [ ] First production deploy
- [ ] End-to-end smoke test (full order lifecycle)

#### 4.4 Monitoring & Maintenance
- [ ] Set up automated DB backups (pg_dump → external storage)
- [ ] Set up uptime monitoring
- [ ] Configure log rotation
- [ ] Document runbook (how to restart services, restore backup)

---

## KEY DECISIONS (Locked — Do Not Re-debate)

| Decision | Choice | Reason |
|---|---|---|
| Hosting | Hostinger KVM 2 VPS (Mumbai) | Full control, India servers, ₹799/mo |
| Database | PostgreSQL via Supabase | Realtime built-in, Auth built-in |
| Realtime | Supabase Realtime | WebSockets, works on VPS |
| PWA Manager | next-pwa | Simplest integration for Next.js |
| Deploy Tool | Coolify | Push-to-deploy, free, auto-SSL |
| Image Retention | 30 days | Client confirmed |
| Customer Login | ❌ NONE | Customers use public tracking link — no accounts |
| Staff Login | Email + Password | Admin creates staff accounts manually |
| Customer Identification | Phone number on order | Plain text field, no auth needed |
| Tracking Link | `/track/[random-token]` | Sent via WhatsApp after order creation |
| Customer Notifications | ✅ WhatsApp messages | Pre-filled `wa.me` links, staff hits Send |
| Customer ↔ Staff Chat | ✅ WhatsApp / Phone call | Sales taps Call or WhatsApp button on order card |
| WhatsApp API | ❌ No Business API | Simple `wa.me` deep links only — zero cost |
| Order Numbering | 6-digit ID (Branch + 5-digit sequence), e.g., 100001 | First digit = branch, rest = order number |
| Staff ID Numbering | `{ROLE}-{Branch}{Sequence}`, e.g., `CHEF-101` | `1` = Branch 1, `01` = Staff sequence. `ADM-001` for HQ. |
| Photos per Priority Order | Max 5 | Already in prototype |
| Multi-branch | 4 Branches | 1=Uma Char Rasta, 2=Khanderao, 3=Warasiya Factory, 4=Ellora Park |

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, never expose to client

# App
NEXT_PUBLIC_APP_URL=https://gopalkakeshop.com
NEXT_PUBLIC_BRANCH_ID=          # Khanderao branch UUID

# Redis (Phase 2+)
REDIS_URL=redis://localhost:6379
```

---

## FILE STRUCTURE (Key Files)

```
src/
├── app/
│   ├── (public)/              # No auth required
│   │   ├── page.tsx           # Homepage ✅
│   │   ├── track/[orderId]/   # Order tracking ❌ TODO
│   │   └── login/             # Login page ❌ TODO
│   ├── (customer)/            # Requires customer auth
│   │   └── my-orders/         # ❌ TODO
│   ├── sales/                 # Requires sales/admin auth ✅ (UI only)
│   ├── chef/                  # Requires chef/admin auth ✅ (UI only)
│   ├── delivery/              # Requires delivery/admin auth ✅ (UI only)
│   └── admin/                 # Requires admin auth ✅ (basic)
├── components/
│   ├── home/                  # Homepage components ✅
│   ├── sales/                 # Sales components ✅
│   ├── layout/                # Noise, Preloader, CustomCursor ✅
│   ├── magicui/               # NumberTicker, Particles, BorderBeam ✅
│   └── aceternity/            # Meteors, TypewriterEffect, etc ✅
├── context/
│   └── OrderContext.tsx        # ⚠️ FAKE DATA — replace with Supabase in Phase 2
├── lib/
│   └── supabase/              # ❌ TODO — create in Phase 2
│       ├── client.ts
│       ├── server.ts
│       ├── middleware.ts
│       ├── orders.ts
│       ├── messages.ts
│       └── notifications.ts
└── middleware.ts               # ❌ TODO — auth + role routing
```

---

## EXECUTION ORDER (Strict — Follow This)

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
            ↑
    Never skip ahead to backend
    while frontend is incomplete
```

### Phase 1 Completion Criteria (Frontend Done)
- [ ] All pages listed in ROUTES MAP exist and render without errors
- [ ] All forms have proper validation (no empty submits)
- [ ] Mobile-optimized (all pages work on 375px width phone)
- [ ] No console errors, no TypeScript errors
- [ ] PWA manifest + service worker installed

### Phase 2 Completion Criteria (Backend Done)
- [ ] Real login works for all 5 roles
- [ ] Creating an order saves to PostgreSQL
- [ ] Chef accepting/rejecting updates DB in realtime
- [ ] Delivery completing updates DB in realtime
- [ ] All dashboards show live data

### Phase 3 Completion Criteria (Messaging Done)
- [ ] WhatsApp buttons (Call + Chat) appear on every order card with correct pre-filled messages
- [ ] Auto WhatsApp message templates built for all 6 key order events
- [ ] Sales can internally message chef about order details (in-app)
- [ ] Sales can internally message driver (in-app)
- [ ] Notification bell shows real unread count for staff
- [ ] All key events auto-insert staff notifications

### Phase 4 Completion Criteria (Production Done)
- [ ] App accessible at real domain with HTTPS
- [ ] All roles can log in on phone as PWA
- [ ] Full order lifecycle tested end-to-end on production
- [ ] Automated backups running

---

## NOTES FOR NEXT AI SESSION

> If you are reading this as a new AI model picking up this project:

1. **Read the CURRENT STATE section** — know what's built and what's fake
2. **Check which Phase we are in** — ask the user before assuming
3. **Never modify working UI** without explicit instruction
4. **The `OrderContext.tsx` fake data is intentional** for Phase 1 — do not remove until Phase 2
5. **Design system is locked** — warm cream/gold/brown palette, glassmorphism, Framer Motion
6. **Mobile-first** — every change must work on a 375px phone screen
7. **All icons from `iconsax-react`** — do not use random icons that don't exist in that library
8. **Check exports before using** — `CheckCircle` does NOT exist in iconsax-react, use `TickCircle`
9. **NO CUSTOMER LOGIN** — This is locked. Do not build /my-orders, do not add customer to auth.users, do not add phone OTP. Customers = anonymous, identified only by phone number on the order record.
10. **Tracking link flow** — When sales creates an order, generate a `tracking_token` (UUID), save it on the order, and the WhatsApp message includes `gopalkakeshop.com/track/{tracking_token}`
11. **WhatsApp = customer comms channel** — All customer notifications + conversations go through WhatsApp. Use `wa.me/91{phone}?text={encoded}` deep links. No WhatsApp Business API. Staff opens WhatsApp on their phone and sends the pre-filled message.
12. **Call button** — Every order card in Sales and Delivery must have a `tel:` link so staff can call the customer in one tap.
13. **Never build in-app customer chat** — This decision is final. If a customer needs to communicate, they call/WhatsApp the shop directly.

---

*End of SPEC — Keep this file updated as decisions are made*
