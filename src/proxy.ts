import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { localizePathname, splitLocalePathname } from "@/i18n/paths";
import { routing } from "@/i18n/routing";

const PUBLIC_ROUTES = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/privacy",
  "/refund-policy",
  "/terms",
  "/verify-email",
  "/reset-password",
] as const;

const AUTH_ROUTES = ["/auth/sign-in", "/auth/sign-up"] as const;
const SESSION_COOKIE_CACHE_VERSION = "skrap-auth-v1";
const handleI18nRouting = createMiddleware(routing);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function buildRedirectToSignIn(request: NextRequest, locale: (typeof routing.locales)[number], normalizedPathname: string): NextResponse {
  const url = new URL(localizePathname("/auth/sign-in", locale), request.url);
  const next = `${localizePathname(normalizedPathname, locale)}${request.nextUrl.search}`;
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function buildRedirectToDashboard(
  request: NextRequest,
  locale: (typeof routing.locales)[number]
): NextResponse {
  return NextResponse.redirect(new URL(localizePathname("/dashboard", locale), request.url));
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
  const i18nResponse = handleI18nRouting(request);
  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse;
  }

  const { locale, pathname: normalizedPathname } = splitLocalePathname(request.nextUrl.pathname);
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const onPublicRoute = isPublicRoute(normalizedPathname);

  if (!hasSessionCookie && !onPublicRoute) {
    return buildRedirectToSignIn(request, locale, normalizedPathname);
  }

  if (hasSessionCookie && isAuthRoute(normalizedPathname)) {
    const hasValidSession = await hasValidSessionCache(request);
    if (hasValidSession) {
      return buildRedirectToDashboard(request, locale);
    }
  }

  return i18nResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
