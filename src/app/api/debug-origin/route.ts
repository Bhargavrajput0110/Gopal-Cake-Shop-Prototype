import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'edge';

export function GET(req: NextRequest) {
  return NextResponse.json({
    origin: req.nextUrl.origin,
    host: req.headers.get('host'),
    xForwardedHost: req.headers.get('x-forwarded-host'),
    xForwardedProto: req.headers.get('x-forwarded-proto'),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
