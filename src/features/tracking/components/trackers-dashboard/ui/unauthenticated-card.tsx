"use client";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function TrackersDashboardUnauthenticated() {
  const t = useTranslations("tracking.dashboard.unauthenticated");

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "sm" })}>
          {t("cta")}
        </Link>
      </CardContent>
    </Card>
  );
}
