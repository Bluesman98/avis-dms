import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set security headers for all responses
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  if (process.env.NODE_ENV === "development") {
    response.headers.set(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );
  } else {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline';",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data:;",
        "font-src 'self' https://fonts.gstatic.com data:;",
        "connect-src 'self' https://avis-dms-bucket.s3.eu-central-1.amazonaws.com https://kilkisbucket.s3.eu-central-1.amazonaws.com https://firestore.googleapis.com https://*.firebaseio.com https://*.googleapis.com;", // <-- Added kilkisbucket S3
        "object-src 'none';",
        "frame-ancestors 'none';",
        "base-uri 'self';",
        "form-action 'self';",
        "media-src 'self';",
        "frame-src 'none';",
        "manifest-src 'self';",
        "worker-src 'self';",
        "child-src 'self';",
        //"require-trusted-types-for 'script';",
      ].join(" ")
    );
  }

  const { pathname } = request.nextUrl;

  if (isAllowedPath(pathname)) {
    return response;
  }

  const isAuthenticated = !!request.cookies.get("token");
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Check for 2FA cookies
  const has2FASecret = request.cookies.get("has_2fa_secret")?.value === "true";
  const is2FAVerified = request.cookies.get("2fa_verified")?.value === "true";

  if (!has2FASecret) {
    return NextResponse.redirect(new URL("/auth/2fa-setup", request.url));
  }

  if (has2FASecret && !is2FAVerified) {
    return NextResponse.redirect(new URL("/auth/2fa-verify", request.url));
  }

  const passwordExpired =
    request.cookies.get("passwordExpired")?.value === "true";
  if (passwordExpired) {
    return NextResponse.redirect(
      new URL("/auth/force-password-reset", request.url)
    );
  }

  return response;
}

const ALLOWED_PATHS = [
  "/auth/signin",
  "/auth/2fa-verify",
  "/auth/2fa-setup",
  "/auth/force-password-reset",
  "/auth/signout",
  "/_next",
  "/favicon.ico",
  "/public",
  "/avis-vector-logo.svg",
  "/home",
];

function isAllowedPath(path: string) {
  return ALLOWED_PATHS.some((allowed) => path.startsWith(allowed));
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico|[\\w-]+\\.[\\w]+).*)"],
};
