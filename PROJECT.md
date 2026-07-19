# Project: Point of Sale & Performance Stress Testing

## Architecture
- **Tech Stack**: Next.js 16 (App Router), TypeScript, Express + Socket.io custom server (`server.js`), Supabase client (`supabaseAdmin`) querying PostgreSQL.
- **Data Flow**:
  - Point of Sale (POS) client at `/sales/pos` loads products & categories, accepts user orders, and sends requests to POST `/api/orders`.
  - Next.js api routes (`/api/orders`, `/api/products`, etc.) interact with Supabase tables.
  - Custom socket.io server processes events and broadcasts real-time changes to the branch room (e.g. `branch_khanderao`).
- **Shared Interfaces**:
  - `Order` creation request payload.
  - `Product` and `Category` models.

## Code Layout
- `src/app/sales/pos/page.tsx`: Point of Sale UI Page.
- `src/app/api/orders/route.ts`: Order endpoints (GET orders, POST new orders).
- `src/app/api/products/route.ts`: Products GET/POST route.
- `src/app/api/categories/route.ts`: Categories GET/POST route.
- `scripts/load_test.js`: Custom stress testing script to run locally and output performance metrics.
- `src/lib/supabase.ts`: Supabase client configuration.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | POS Verification & Integration | Build/fix POS interface and order creation integration | None | PLANNED |
| 2 | Load-Testing Setup | Implement `scripts/load_test.js` to stress-test order traffic | Milestone 1 | PLANNED |
| 3 | Performance Optimization | Query indexing, response caching, render/image optimizations | Milestone 2 | PLANNED |
| 4 | E2E & Integrity Verification | End-to-end load-test run, final project build, and Forensic Audit verification | Milestone 3 | PLANNED |

## Interface Contracts
### Order Creation Payload (`POST /api/orders`)
```json
{
  "orderType": "takeaway" | "delivery",
  "status": "waiting_for_chef",
  "customerName": "string",
  "customerPhone": "string",
  "branch": "string",
  "items": [
    {
      "name": "string",
      "qty": 1,
      "weight": "string"
    }
  ],
  "subtotal": 0.0,
  "discount": 0.0,
  "tax": 0.0,
  "deliveryCharge": 0.0,
  "grandTotal": 0.0,
  "advancePaid": 0.0,
  "pendingBalance": 0.0,
  "priorityLevel": "normal" | "priority" | "vip",
  "isSurprise": false,
  "timeTarget": "ISO_DATE_STRING",
  "customerInstructions": "string"
}
```
### Order Status Update (`PATCH /api/orders/[id]/status`)
```json
{
  "status": "string",
  "actorName": "string",
  "actorId": "string",
  "branchId": "string"
}
```
