# Project Context — Gopal Cake Shop

## Current Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Database**: Supabase client (`supabaseAdmin`) for PostgreSQL queries (Order, User, Branch, Customer, Product, Category tables, etc.). Note: `package.json` contains `mongoose` and Mongoose is mentioned in some briefing docs, but the active codebase routes query Supabase.
- **Real-time**: Custom `server.js` with Express and Socket.IO. We should run the custom server `node server.js` to run the stack.
- **Public access**: Customer order tracking route `/track/[orderId]` is a public page (no login).

## Key Roles & Credentials
- **Admin**: `admin@gopal.com` / `admin123` -> `/admin`
- **Sales**: `sales@gopal.com` / `sales123` -> `/sales`
- **Chef**: `chef@gopal.com` / `chef123` -> `/chef`
- **Delivery**: `delivery@gopal.com` / `delivery123` -> `/delivery`
- **Manager**: `manager@gopal.com` / `manager123` -> `/manager`

## Key Rules & Workflow
- Order statuses: `new`, `waiting_for_chef` (sales editable), `accepted_by_chef` (locked), `preparing`, `decorating`, `ready_for_pickup`, `pending_assignment`, `assigned_to_driver`, `picked_up_by_driver`, `on_the_way`, `delivered`, `cancelled`.
- Only salesperson communicates with customers.
- Revenue analytics are Admin-only.
- Custom Server is launched via `node server.js` (not `npm run dev`).
