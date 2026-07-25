import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Rate limit memory store (Note: In a multi-instance production environment, use Redis)
// For this single-instance / serverless deployment, Vercel Edge KV or basic memory works for demo.
const rateLimit = new Map<string, { count: number; expires: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || record.expires < now) {
    rateLimit.set(ip, { count: 1, expires: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

// Staff routes that require a valid NextAuth session
const STAFF_PROTECTED_ROUTES = [
  '/admin',
  '/sales',
  '/chef',
  '/driver',
  '/vendor',
  '/manager',
  '/supplier',
];

// Customer routes that require Supabase customer auth
const CUSTOMER_PROTECTED_ROUTES = ['/customer/orders'];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const url = request.nextUrl.pathname;

  // ── 1. Route Protection ─────────────────────────────────────────────────────

  // Check if the request is for a staff-protected route
  const isStaffRoute = STAFF_PROTECTED_ROUTES.some(route => url === route || url.startsWith(route + '/'));
  if (isStaffRoute) {
    // NextAuth v5 session cookie names
    const hasSession =
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token') ||
      // Allow prototype demo cookie to bypass (for client demos without real DB)
      request.cookies.has('gopal_dummy_role');

    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check if the request is for a customer-protected route
  const isCustomerRoute = CUSTOMER_PROTECTED_ROUTES.some(route => url === route || url.startsWith(route + '/'));
  if (isCustomerRoute) {
    // Supabase auth uses sb-* cookies
    const hasCustomerSession = [...request.cookies.getAll()].some(c => c.name.startsWith('sb-'));
    if (!hasCustomerSession) {
      const loginUrl = new URL('/customer/login', request.url);
      loginUrl.searchParams.set('callbackUrl', url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 2. Inject Correlation ID ─────────────────────────────────────────────────
  let correlationId = request.headers.get('x-correlation-id');
  if (!correlationId) {
    correlationId = uuidv4();
    request.headers.set('x-correlation-id', correlationId);
    response.headers.set('x-correlation-id', correlationId);
  }

  // ── 3. Security Headers (HSTS, CSP, X-Frame-Options) ────────────────────────
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic CSP (expand as needed for Cloudinary, Vercel analytics, etc.)
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://res.cloudinary.com;
    font-src 'self';
    connect-src 'self' https://vercel.live wss://ws-us3.pusher.com;
  `.replace(/\s{2,}/g, ' ').trim();
  response.headers.set('Content-Security-Policy', csp);

  // ── 4. Tiered Rate Limiting ──────────────────────────────────────────────────
  if (url.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Auth endpoints -> Strict limit (e.g., 5 requests per minute)
    if (url.includes('/api/auth') || url.includes('/login')) {
      if (!checkRateLimit(`auth:${ip}`, 5, 60000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
    // Public API / Tracking -> Moderate limit (e.g., 30 requests per minute)
    else if (url.startsWith('/api/v1/public/')) {
      if (!checkRateLimit(`public:${ip}`, 30, 60000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
    // Internal Authenticated APIs -> Higher limit (e.g., 100 requests per minute)
    else {
      if (!checkRateLimit(`internal:${ip}`, 100, 60000)) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
