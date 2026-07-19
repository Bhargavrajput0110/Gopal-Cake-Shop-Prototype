# BRIEFING — 2026-07-05T16:09:17+05:30

## Mission
Implement Reviews APIs, PWA Push Notifications, and PDF Invoice Generation for Gopal Cake Shop.

## ?? My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: d:\Gopal Cake Shop\.agents\teamwork_preview_worker_m2_1
- Original parent: a4623ad6-ac7b-4747-8ebf-3fd9e6857cce
- Milestone: Milestone 2: Backend APIs & SW

## ?? Key Constraints
- CODE_ONLY network mode
- Write only to our own folder under .agents/ for metadata, but edit files in workspace as required.

## Current Parent
- Conversation ID: a4623ad6-ac7b-4747-8ebf-3fd9e6857cce
- Updated: not yet

## Task Summary
- **What to build**:
  - Install dependencies: web-push, @types/web-push, jspdf.
  - Reviews APIs: `src/app/api/reviews/route.ts` (POST, GET) and `src/app/api/reviews/moderate/route.ts` (PATCH).
  - PWA Push Notifications: VAPID keys, VAPID public key API, Subscribe API, custom Service Worker, PWA registration in layout, and Order Status notification trigger.
  - PDF Invoice Generation helper: `src/lib/invoice.ts` client-side PDF invoice layout generator.
- **Success criteria**: APIs working, PDF helper implemented, service worker listening and registered, Next.js build passes.
- **Interface contracts**: PROJECT.md, SPEC.md
- **Code layout**: Next.js src directory

## Key Decisions Made
- Use standard Next.js route handlers for APIs.
- Store VAPID keys in environment variables or constants.
- Implement client-side PDF generation using `jspdf` to minimize server load.

## Artifact Index
- d:\Gopal Cake Shop\src\app\api\reviews\route.ts — Reviews GET and POST API
- d:\Gopal Cake Shop\src\app\api\reviews\moderate\route.ts — Review moderation API
- d:\Gopal Cake Shop\src\app\api\notifications\vapid-public-key\route.ts — VAPID public key GET API
- d:\Gopal Cake Shop\src\app\api\notifications\subscribe\route.ts — Push subscription POST API
- d:\Gopal Cake Shop\public\sw-custom.js — Custom Service Worker
- d:\Gopal Cake Shop\src\components\PWARegistration.tsx — Service Worker Client Registration
- d:\Gopal Cake Shop\src\lib\invoice.ts — Client-side PDF Invoice Generator helper
