import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = path.startsWith('/admin') || 
                           path.startsWith('/sales') || 
                           path.startsWith('/chef') || 
                           path.startsWith('/delivery');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Paths that require authentication
  const roleCookie = request.cookies.get('gopal_dummy_role')?.value;

  if (!roleCookie) {
    // If trying to access protected route without login, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  if (path.startsWith('/admin') && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/sales') && roleCookie !== 'sales' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/chef') && roleCookie !== 'chef' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }
  if (path.startsWith('/delivery') && roleCookie !== 'delivery' && roleCookie !== 'admin') {
    return NextResponse.redirect(new URL(`/${roleCookie}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
