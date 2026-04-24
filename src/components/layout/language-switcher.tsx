"use client";

import { useTransition } from "react";
import { Languages, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

const SUPPORTED_LOCALES: AppLocale[] = ["en", "tr"];

export default function LanguageSwitcher() {
  const t = useTranslations("layout.language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const options = SUPPORTED_LOCALES.map((value) => ({
    value,
    label: t(`options.${value}`),
  }));

  return (
    <div className="inline-flex items-center gap-1.5">
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : (
        <Languages className="size-3.5 text-muted-foreground" />
      )}
      <AnimatedDropdown
        value={locale}
        onValueChange={(value) => {
          const nextLocale = value as AppLocale;
          const query = searchParams.toString();
          const href = query ? `${pathname}?${query}` : pathname;
          startTransition(() => {
            router.replace(href, { locale: nextLocale });
          });
        }}
        options={options}
        className="w-36"
        disabled={isPending}
      />
    </div>
  );
}
