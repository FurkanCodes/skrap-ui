import { routing, type AppLocale } from "@/i18n/routing";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}

export function splitLocalePathname(pathname: string): {
  locale: AppLocale;
  pathname: string;
  hasLocalePrefix: boolean;
} {
  const segments = pathname.split("/");
  const firstSegment = segments[1];

  if (isAppLocale(firstSegment)) {
    const withoutLocale = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "");
    return {
      locale: firstSegment,
      pathname: withoutLocale === "" ? "/" : withoutLocale,
      hasLocalePrefix: true,
    };
  }

  return {
    locale: routing.defaultLocale,
    pathname,
    hasLocalePrefix: false,
  };
}

export function localizePathname(pathname: string, locale: AppLocale): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return normalized;
  }

  if (normalized === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalized}`;
}
