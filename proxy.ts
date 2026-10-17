import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth endpoint
  if (pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = verifySessionToken(sessionCookie?.value);
  const hasSession = session.valid;

  // Guard all other API routes with a 401 JSON response
  if (pathname.startsWith('/api/')) {
    if (!hasSession) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid staff session required.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If visiting /login and already has active session, redirect to home
  if (pathname === '/login') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all internal application pages
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // If cookie was present but invalid/expired, clear it
    if (sessionCookie?.value) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images and public assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
