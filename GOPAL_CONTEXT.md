# 🎂 GOPAL CAKE SHOP — Shared Context File
> **How to use this file:**
> - Copy key decisions, plans, and notes from ChatGPT and paste them here.
> - When starting a new session with Antigravity (Rohan), say: **"Read the context file"**
> - Keep this file updated as the single source of truth for the project.

---

## 📍 Project Overview
- **Business:** Gopal Cake Shop — Multi-branch cake shop management system
- **Type:** Internal Staff PWA (Progressive Web App) + Customer-facing Website
- **Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Hosting:** Vercel (auto-deploys from GitHub `main` branch)
- **GitHub Repo:** https://github.com/Bhargavrajput0110/Gopal-Cake-Shop-Prototype

---

## 🏢 Branches
| Branch Name | Order ID Prefix |
|---|---|
| Khanderao Branch | `KHM` |
| Uma Branch | `UMA` |
| Varasiya Factory Outlet | `WAS` |
| Elora Park Branch | `ELR` |

> **Order ID Format:** `[BRANCH]-[5-digit number]` e.g. `KHM-10201`

---

## 👥 Roles & Login Credentials

| Role | Email | Password | Route |
|---|---|---|---|
| Admin | admin@gopal.com | admin123 | `/admin` |
| Sales | sales@gopal.com | sales123 | `/sales` |
| Chef | chef@gopal.com | chef123 | `/chef` |
| Delivery | delivery@gopal.com | delivery123 | `/delivery` |
| Manager | manager@gopal.com | manager123 | `/manager` |
| Florist | florist@gopal.com | florist123 | `/vendor?type=flower` |
| Photo Print | photo@gopal.com | photo123 | `/vendor?type=photo` |
| Acrylic Maker | acrylic@gopal.com | acrylic123 | `/vendor?type=acrylic` |

---

## 🔐 Role Permissions Summary

### Salesperson
- ✅ View & approve new orders
- ✅ Edit orders (only while status = `waiting_for_chef`)
- ✅ View order-level payment info (Total, Advance, Pending Balance)
- ✅ Assign vendors (Florist, Photo, Acrylic)
- ✅ View ingredient requests from chef
- ✅ Monitor delivery pool (read-only)
- ✅ Create manual orders (walk-in / phone)
- ❌ Cannot assign delivery drivers (drivers self-assign)
- ❌ Cannot see Revenue, Analytics, or Branch Financial Reports

### Chef
- ✅ See all orders in `waiting_for_chef` pool
- ✅ First chef to click Accept → gets the order (no manual assignment)
- ✅ Update production status (Preparing → Decorating → Ready)
- ✅ Send ingredient requests (structured list)
- ❌ Cannot see customer financials

### Delivery Driver
- ✅ Self-assign from the delivery pool
- ✅ Update delivery status (Picked Up → On the Way → Delivered)
- ❌ Cannot see order financials

### Vendor (Florist / Photo Print / Acrylic)
- ✅ See tasks assigned to them (filtered by their type)
- ✅ See cake image + instructions
- ✅ Mark task as Ready
- ✅ Filter by branch
- ❌ Cannot see other vendor types (login is locked to their type)

### Admin
- ✅ Full financial visibility (Daily/Weekly/Monthly Revenue, Branch-wise, etc.)
- ✅ Full order history across all branches
- ✅ User management

### Manager
- ✅ Branch operational stats (Orders, Kitchen Performance, Delivery Performance)
- ❌ No revenue access (unless client decides otherwise)

---

## 🔄 Order Workflow (Finalized)

```
Customer Places Order
        ↓
Salesperson Reviews → Approves
        ↓
Status: waiting_for_chef
(Salesperson CAN still edit here)
        ↓
All Chefs in Branch see it in Pool
First Chef clicks "Accept Order"
        ↓
Status: accepted_by_chef
(Order is now LOCKED — no more edits)
        ↓
Chef: preparing → decorating → ready_for_pickup
        ↓
Order appears in Delivery Pool
        ↓
Driver self-assigns from pool
        ↓
Status: picked_up_by_driver → on_the_way → delivered
```

---

## 🧪 Ingredient Request System (Chef → Salesperson)

Chef can request the following items (structured, not free text):

`Choco Sponge` · `Vanilla Sponge` · `Rainbow Sponge` · `Dark Chocolate` · `Milk Chocolate` · `White Chocolate` · `White Choco Chips` · `Black Choco Chips` · `Fondant (Colour)` · `Gel Colour (Colour)` · `Nutella` · `Biscoff Spread` · `Biscoff Biscuit` · `Butterfly (Colour)` · `Hamper Tray` · `Hamper Box` · `Topper` · `Flower` · `Mould` · `Oreo` · `Five Star` · `KitKat` · `Other`

---

## 🏪 Vendor Structure
- **Only 1 vendor per type** (1 Florist, 1 Photo Print, 1 Acrylic Maker)
- All 3 vendors serve **all 4 branches**
- Vendor dashboard filtered by branch and task status

---

## 📋 Pending Tasks (To Be Built)

> Add tasks here whenever GPT or Antigravity identifies something to implement.

### Salesperson
- [ ] **Salesperson Dashboard Redesign** — Remove financial cards, add 8 operational widgets
- [ ] **`waiting_for_chef` status** — New order status in OrderContext
- [ ] **Order Edit Modal** — Edit order fields while `waiting_for_chef`
- [ ] **Order Timeline Panel** — Permanent event log per order
- [ ] **Audit Log** — Field-level change tracking (old → new value)
- [ ] **Ingredient Request Panel** — On salesperson dashboard (receives chef requests)
- [ ] **Quick Actions on Order Cards** — View, Edit, Approve, Cancel, Vendor, WhatsApp, Timeline, Receipt
- [ ] **Search & Filters on Order Queue** — By Order ID, Name, Phone, Cake, Status
- [ ] **Simulated WhatsApp confirmation** — Shown after order edit/approval
- [ ] **Admin Financial Dashboard** — Full revenue charts and reports
- [ ] **Manager Dashboard** — Branch operational stats only

### Chef
- [ ] **Remove Reject Order button** — Chef simply does not accept; order stays in pool
- [ ] **Change Incoming column status** — `accepted_by_chef` → `waiting_for_chef`
- [ ] **Structured Ingredient Request Modal** — Replace generic button with 23-item dropdown form
- [ ] **QC improvement** — Two checkboxes: "Cake matches order" + "Cake packed & ready"
- [ ] **Audio notification** — Chime when new order enters `waiting_for_chef` pool
- [ ] **New order popup** — One-time popup per new order in pool
- [ ] **"Ready By" timer** — Estimated completion time shown on each card
- [ ] **"View Timeline" on Ready column** — Read-only order history for reference
- [ ] **Header stat counters** — Today's Orders / Accepted / Completed
- [ ] **Chef ID from login** — Replace hardcoded `CHEF-101` with login-based ID

---

## ✅ Completed Features

- [x] Multi-branch order management system
- [x] Role-based login (dummy cookie auth)
- [x] Salesperson dashboard (Command Center)
- [x] Chef Kitchen Display System (KDS)
- [x] Delivery driver dashboard + self-assignment
- [x] Vendor dashboard (Florist / Photo / Acrylic) with sign-out
- [x] Ordered cake image shown to all vendors
- [x] 5-digit branch-prefixed order IDs
- [x] PWA conversion (installable on mobile)
- [x] Vercel deployment (auto-deploy from GitHub)
- [x] Customer-facing website with product catalog
- [x] Mobile-optimized vendor dashboard

---

## 📝 Key Business Decisions (Approved)

- Salesperson is the **only role** that communicates with customers
- Chef, Driver, Vendors **never contact customers directly**
- Revenue is **Admin-only** — Salesperson sees order-level payment only
- Delivery drivers **self-assign** from the pool — salesperson only monitors
- Manual chef assignment is **removed** — pool-based, first-come-first-served
- Order edits only allowed **before chef accepts** (`waiting_for_chef` status)
- Every edit must generate **audit log + timeline entry + WhatsApp alert**

---

## 🗒️ Notes from ChatGPT Sessions

> **Paste your ChatGPT context, decisions, and plans here.**
> Keep this section updated so Antigravity (Rohan) stays in sync.

---

*Last Updated: 2026-06-27*
*Maintained by: Bhargav (Owner) + Antigravity (Rohan) + ChatGPT*
