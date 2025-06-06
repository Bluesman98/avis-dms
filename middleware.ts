import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of routes that should be accessible even if password is expired
const ALLOWED_PATHS = ['/auth/force-password-reset', '/auth/signout', '/_next', '/favicon.ico', '/public'];

export function middleware(request: NextRequest) {
  // Example: get user and password status from cookies or session
  const passwordExpired = request.cookies.get('passwordExpired')?.value === 'true';

  // Allow access to allowed paths
  if (ALLOWED_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // If password is expired, redirect to password reset
  if (passwordExpired) {
    return NextResponse.redirect(new URL('/auth/force-password-reset', request.url));
  }

  // Otherwise, allow the request
  return NextResponse.next();
}