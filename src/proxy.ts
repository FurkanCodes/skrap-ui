import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/verify-email",
  "/reset-password",
] as const;

const AUTH_ROUTES = ["/auth/sign-in", "/auth/sign-up"] as const;
const SESSION_COOKIE_CACHE_VERSION = "skrap-auth-v1";

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function buildRedirectToSignIn(request: NextRequest): NextResponse {
  const url = new URL("/auth/sign-in", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function buildRedirectToDashboard(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

async function hasValidSessionCache(request: NextRequest): Promise<boolean> {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    return Boolean(getSessionCookie(request));
  }

  try {
    const cachedSession = await getCookieCache(request, {
      secret,
      strategy: "jwe",
      version: SESSION_COOKIE_CACHE_VERSION,
    });
    if (!cachedSession?.session) {
      return false;
    }

    const expiresAt = new Date(String(cachedSession.session.expiresAt)).getTime();
    if (Number.isNaN(expiresAt)) {
      return false;
    }

    return expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const onPublicRoute = isPublicRoute(pathname);

  if (!hasSessionCookie && !onPublicRoute) {
    return buildRedirectToSignIn(request);
  }

  if (hasSessionCookie && (pathname === "/" || isAuthRoute(pathname))) {
    const hasValidSession = await hasValidSessionCache(request);
    if (hasValidSession) {
      return buildRedirectToDashboard(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
