# 🚀 Antigravity Project Brief: Gopal Cake Shop

**Date:** July 2, 2026
**Project:** Gopal Cake Shop (Internal ERP / PWA + Customer Website)
**Tech Stack:** Next.js 16 (App Router), Node/Express, Socket.io, MongoDB Atlas (Mongoose), Tailwind, Framer Motion.

---

## 📍 Where We Are Right Now (Current State)

We have just successfully completed a massive **Operations Update & Backend Overhaul**. 

### 1. Database & Real-Time Sync (COMPLETED)
- The app is no longer just using a prototype in-memory store. 
- We have fully implemented **MongoDB** using Mongoose models (Order, User, Branch, Customer, Product, Category, Setting, Notification).
- We have a custom `server.js` running Express and **Socket.io**.
- The API routes (`/api/orders`, `/api/orders/[id]`, `/api/orders/[id]/status`) successfully write to MongoDB and immediately emit `order_updated` WebSocket events to all connected clients in the branch room for true real-time syncing.
- *Note: We are using a local MongoDB connection (`mongodb://127.0.0.1:27017/gopal-bakery`) in `.env.local` for development.*

### 2. Operational UI Features (COMPLETED)
- **Salesperson Dashboard:** Fully functional with Order Edit Modals, Immutable Audit Logging, Order Timelines, and simulated WhatsApp confirmation toasts. Sales can edit orders *only* while in `waiting_for_chef` status.
- **Chef KDS (Kitchen Display System):** Fully functional with 23-item Structured Ingredient Requests, mandatory QC checkboxes before dispatch, "Ready By" timers, and automated priority alerts (visual and audio sirens).

---

## 🎯 What to do NEXT (The Backlog)

The core order flow (Sales -> Chef -> Delivery) is built and connected to MongoDB. The next major tasks to tackle are:

1. **The Admin Financial Dashboard**
   - *Goal:* Create a highly secure `/admin` route.
   - *Features:* Build beautiful, data-rich charts showing Daily/Weekly/Monthly Revenue, Branch-wise comparisons, and top-selling cakes. Since Sales cannot see revenue anymore, the Admin needs a powerful command center.

2. **The Manager Operational Dashboard**
   - *Goal:* Create a `/manager` route.
   - *Features:* This dashboard should NOT show money. It should show operational efficiency (Kitchen baking times, delivery times, delayed order counts, etc.).

3. **Customer PWA / Landing Page Enhancements**
   - *Goal:* We previously started making the customer website extremely premium and "cinematic" with floating borderless cards and anti-gravity sprinkle physics. 
   - *Features:* We need to finish building the "Stacked Parallax Gallery" for displaying cakes on the homepage.

4. **Authentication & Security**
   - *Goal:* Replace the dummy cookie authentication with a real JWT or NextAuth implementation connected to the `User` MongoDB model.

---

## 🤖 Instructions for Antigravity (Rohan)
- When picking up tasks, always refer to the `GOPAL_CONTEXT.md` file for deep business logic and role permissions.
- You can run the full stack (Next.js + Socket.io) by running `node server.js`. 
- Do not run `npm run dev` directly, as it will bypass the custom socket server.
- The user is currently downloading MongoDB Community Server. If database connection fails, the API routes are designed to gracefully fall back to a `memoryStore` so development is never blocked!
