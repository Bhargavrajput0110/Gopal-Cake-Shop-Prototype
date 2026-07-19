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

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = request.nextUrl.pathname;

  // 1. Inject Correlation ID
  let correlationId = request.headers.get('x-correlation-id');
  if (!correlationId) {
    correlationId = uuidv4();
    request.headers.set('x-correlation-id', correlationId);
    // Also set it on the response so the client knows it
    response.headers.set('x-correlation-id', correlationId);
  }

  // 2. Security Headers (HSTS, CSP, X-Frame-Options)
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

  // 3. Tiered Rate Limiting
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
