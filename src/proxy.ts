import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PUBLIC_API_PATHS = ['/api/auth']
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

// Cookie presence only (no DB round trip) — requireSession() re-verifies the real session server-side.
function isAuthenticated(request: NextRequest): boolean {
  return !!getSessionCookie(request)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (matchesPath(pathname, PUBLIC_API_PATHS)) {
    return NextResponse.next()
  }

  const authed = isAuthenticated(request)

  if (matchesPath(pathname, AUTH_PATHS)) {
    return authed
      ? NextResponse.redirect(new URL('/journal', request.url))
      : NextResponse.next()
  }

  if (!authed) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
