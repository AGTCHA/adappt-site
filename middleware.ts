import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "adapt_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/drivers",
  "/leads",
  "/recruiting",
  "/fleet",
  "/maintenance",
  "/job-ads",
  "/messages",
  "/support",
  "/tms",
  "/dispatch",
  "/crm",
  "/office",
  "/portal",
  "/settings",
  "/platform",
];

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const secret = getSecret();
  if (!secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

const PUBLIC_PREFIXES = ["/sign/", "/tms/track/", "/api/tms/track/", "/api/tms/rate-cons/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isProtected =
    !isPublic && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/login" || pathname === "/signup") {
    const authed = await isAuthenticated(request);
    if (authed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/drivers/:path*",
    "/leads/:path*",
    "/recruiting/:path*",
    "/fleet/:path*",
    "/maintenance/:path*",
    "/job-ads/:path*",
    "/messages/:path*",
    "/support/:path*",
    "/tms/:path*",
    "/dispatch/:path*",
    "/crm/:path*",
    "/office/:path*",
    "/portal/:path*",
    "/settings/:path*",
    "/platform/:path*",
    "/login",
    "/signup",
  ],
};
