import { routing, type AppLocale } from "@/i18n/routing";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === routing.defaultLocale;
}

export function splitLocalePathname(pathname: string): {
  locale: AppLocale;
  pathname: string;
  hasLocalePrefix: boolean;
} {
  const segments = pathname.split("/");
  const firstSegment = segments[1];

  if (firstSegment === "en" || firstSegment === "tr") {
    const withoutLocale = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "");
    return {
      locale: routing.defaultLocale,
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

export function localizePathname(pathname: string, locale?: string | null): string {
  void locale;
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
