import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'auth_token';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'antigravity-secure-jwt-secret-key-production-2026-business-analytics'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths that do not require session cookie authentication
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/mcp') ||
    pathname === '/api/health' ||
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    // If user is already logged in and tries to access /login, redirect to /
    if (pathname === '/login') {
      const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/', req.url));
        } catch {
          // Token invalid, allow /login
        }
      }
    }
    return NextResponse.next();
  }

  // Check auth token for all other routes (cookie or Authorization header)
  let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Forward user identity headers to downstream route handlers and server components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', String(payload.sub));
    requestHeaders.set('x-user-role', String(payload.role));
    if (payload.email) requestHeaders.set('x-user-email', String(payload.email));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Enforce production security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired session' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
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
