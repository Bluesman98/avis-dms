import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; object-src 'none';"
  );

  const { pathname } = request.nextUrl;

  if (isAllowedPath(pathname)) {
    return NextResponse.next();
  }

  const isAuthenticated = !!request.cookies.get('token');
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Check for 2FA cookies
  const has2FASecret = request.cookies.get('has_2fa_secret')?.value === 'true';
  const is2FAVerified = request.cookies.get('2fa_verified')?.value === 'true';

  // If user has not started 2FA setup, redirect to setup
  if (!has2FASecret) {
    return NextResponse.redirect(new URL('/auth/2fa-setup', request.url));
  }

  // If user has a secret but is not verified, redirect to verify
  if (has2FASecret && !is2FAVerified) {
    return NextResponse.redirect(new URL('/auth/2fa-verify', request.url));
  }

  const passwordExpired = request.cookies.get('passwordExpired')?.value === 'true';
  if (passwordExpired) {
    return NextResponse.redirect(new URL('/auth/force-password-reset', request.url));
  }

  return response;
}

const ALLOWED_PATHS = [
  '/auth/signin',
  '/auth/2fa-verify',
  '/auth/2fa-setup',
  '/auth/force-password-reset',
  '/auth/signout',
  '/_next',
  '/favicon.ico',
  '/public',
  '/avis-vector-logo.svg',
];

function isAllowedPath(path: string) {
  return ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
}

export const config = {
  matcher: [
    '/((?!_next|api|static|favicon.ico|[\\w-]+\\.[\\w]+).*)',
  ],
};