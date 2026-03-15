import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Lightweight middleware that checks for the auth session cookie.
 * Does NOT import auth() or the Drizzle adapter — those use Node.js
 * modules (net, tls, crypto) which are unavailable in the Edge Runtime.
 *
 * Full session validation happens in API routes and server components
 * via auth() which runs in the Node.js runtime.
 */
export function middleware(request: NextRequest) {
  // Check for the auth session cookie (Auth.js v5 uses this name)
  const sessionCookie =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token')

  const isAuthPage = request.nextUrl.pathname === '/'
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects')

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect authenticated users from login to dashboard
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
