/**
 * src/proxy.ts  —  Next.js Proxy (renamed from middleware.ts in v16)
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs on the server before any page or API route is rendered.
 *
 * Responsibilities (in order):
 *   1. Route protection  — redirect unauthenticated users to /login
 *   2. Authenticated redirect — send logged-in users away from /login to role home
 *   3. Correlation ID  — inject x-correlation-id for request tracing
 *   4. Security headers  — HSTS, CSP, X-Frame-Options, etc.
 *   5. Tiered rate limiting  — per-IP limits by route class
 *
 * IMPORTANT — module boundary:
 *   This file imports ONLY from 'next-auth' and '@/auth.config'.
 *   It MUST NOT import '@/auth', '@/lib/prisma', or any module that transitively
 *   imports those, because that would pull the Prisma client + env.ts validation
 *   into the proxy bundle and crash on startup if any env vars are absent.
 *
 *   Auth.js v5 explicitly supports this split:
 *     auth.config.ts  → Edge-safe (no Prisma, used here in proxy)
 *     auth.ts         → Node-only (has Prisma adapter, used by API routes & pages)
 *
 * NOTE: This is a perimeter gate, not a data-access gate.
 * API routes additionally verify auth inside withApiHandler().
 * Server components additionally verify auth before rendering privileged UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight auth wrapper — uses only authConfig (no Prisma, Edge-safe)
// ─────────────────────────────────────────────────────────────────────────────
const { auth } = NextAuth(authConfig);

// ─────────────────────────────────────────────────────────────────────────────
// Route Classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paths that are fully public — no session required.
 * Matched by prefix (startsWith).
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/forgot-password',
  '/menu',
  '/product',
  '/about',
  '/track',
  '/custom',
  '/customer/login',
  '/customer/register',
  // Public API routes (unauthenticated reads, checkout, order tracking)
  '/api/v1/public',
  '/api/auth',       // NextAuth's own endpoints — must never be blocked
  '/api/health',
  // Next.js / Sentry internals
  '/_next',
  '/favicon.ico',
  '/sw.js',
  '/workbox-',
  '/manifest.json',
  '/icons',
];

/**
 * Paths that require an authenticated session.
 * Matched by prefix (startsWith). Sub-routes are automatically covered.
 */
const PROTECTED_PREFIXES = [
  '/admin',
  '/chef',
  '/manager',
  '/sales',
  '/driver',
  '/delivery',
  '/order',
  '/checkout',
  '/customer/orders',
  '/customer/profile',
  '/vendor',
  '/supplier',
  '/api/v1/chef',
  '/api/v1/orders',
  '/api/v1/customers',
  '/api/admin',
  '/api/branches',
  '/api/categories',
  '/api/coupons',
  '/api/messages',
  '/api/notifications',
  '/api/products',
  '/api/reviews',
  '/api/settings',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limit memory store
// Note: In multi-instance production, replace with Redis / Vercel KV.
// ─────────────────────────────────────────────────────────────────────────────
const rateLimit = new Map<string, { count: number; expires: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || record.expires < now) {
    rateLimit.set(ip, { count: 1, expires: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count += 1;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Role → Home path mapping
// ─────────────────────────────────────────────────────────────────────────────
function roleHomePath(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'ADMIN':       return '/admin';
    case 'MANAGER':     return '/manager';
    case 'CHEF':        return '/chef';
    case 'SALESPERSON': return '/sales';
    case 'DELIVERY':    return '/driver';
    default:            return '/';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxy — wrapped with auth() for automatic session decoding (Edge-safe)
// ─────────────────────────────────────────────────────────────────────────────
export default auth(function proxy(req: NextRequest) {
  const response = NextResponse.next();
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // auth() injects req.auth with the decoded JWT payload
  const session = (req as any).auth;

  // ── 1. Route Protection ────────────────────────────────────────────────────

  if (isPublicPath(pathname)) {
    // Anti-loop: authenticated users landing on /login → redirect to role home
    if ((pathname === '/login' || pathname.startsWith('/login?')) && session?.user) {
      const role = (session.user as any)?.role;
      return NextResponse.redirect(new URL(roleHomePath(role), nextUrl));
    }
    // Public path — fall through to security headers & rate limiting
  } else if (isProtectedPath(pathname)) {
    if (!session?.user) {
      // Preserve intended destination for post-login redirect
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', nextUrl.href);
      return NextResponse.redirect(loginUrl);
    }
    // Authenticated — continue to the route
  }
  // Unrecognised paths (e.g. root '/', /about, /design-system) — pass through

  // ── 2. Correlation ID ──────────────────────────────────────────────────────
  let correlationId = req.headers.get('x-correlation-id');
  if (!correlationId) {
    correlationId = uuidv4();
    response.headers.set('x-correlation-id', correlationId);
  }

  // ── 3. Security Headers ────────────────────────────────────────────────────
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://res.cloudinary.com;
    font-src 'self';
    connect-src 'self' https://vercel.live wss://ws-us3.pusher.com;
  `.replace(/\s{2,}/g, ' ').trim();
  response.headers.set('Content-Security-Policy', csp);

  // ── 4. Tiered Rate Limiting ────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/login')) {
      // Auth endpoints — strict (5 req/min)
      if (!checkRateLimit(`auth:${ip}`, 5, 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    } else if (pathname.startsWith('/api/v1/public/')) {
      // Public APIs — moderate (30 req/min)
      if (!checkRateLimit(`public:${ip}`, 30, 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    } else {
      // Internal authenticated APIs — generous (100 req/min)
      if (!checkRateLimit(`internal:${ip}`, 100, 60_000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }

  return response;
});

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — control which requests invoke this proxy
// ─────────────────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match every request EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - sw.js / workbox (PWA service worker)
     *  - files with a dot extension (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|workbox-.*|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot|mp4|webm|css|js\\.map)$).*)',
  ],
};
