export const routing = {
  locales: ["en"],
  defaultLocale: "en",
} as const;

export type AppLocale = (typeof routing.locales)[number];
