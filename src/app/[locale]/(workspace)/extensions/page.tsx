import {
  IconArrowRight,
  IconDownload,
  IconKey,
  IconPuzzle,
  IconWorld,
} from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEFAULT_CHROME_EXTENSION_URL = "#chrome-extension";
const DEFAULT_FIREFOX_EXTENSION_URL = "#firefox-extension";

export default async function ExtensionsPage() {
  const t = await getTranslations("extensions");
  const chromeUrl =
    process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL ?? DEFAULT_CHROME_EXTENSION_URL;
  const firefoxUrl =
    process.env.NEXT_PUBLIC_FIREFOX_EXTENSION_URL ?? DEFAULT_FIREFOX_EXTENSION_URL;

  const steps = [
    {
      icon: IconDownload,
      title: t("steps.install.title"),
      description: t("steps.install.description"),
    },
    {
      icon: IconKey,
      title: t("steps.connect.title"),
      description: t("steps.connect.description"),
    },
    {
      icon: IconPuzzle,
      title: t("steps.track.title"),
      description: t("steps.track.description"),
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <InstallCard
          title={t("chrome.title")}
          description={t("chrome.description")}
          href={chromeUrl}
          cta={t("chrome.cta")}
          icon={<IconWorld className="size-5" stroke={1.5} />}
        />
        <InstallCard
          title={t("firefox.title")}
          description={t("firefox.description")}
          href={firefoxUrl}
          cta={t("firefox.cta")}
          icon={<IconPuzzle className="size-5" stroke={1.5} />}
        />
      </div>

      <Card size="sm">
        <CardContent className="grid gap-4 pt-0 md:grid-cols-[10rem_minmax(0,1fr)] md:items-start">
          <div>
            <CardTitle>{t("howItWorks")}</CardTitle>
            <CardDescription className="mt-1">
              {t("howItWorksDescription")}
            </CardDescription>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex gap-2.5 rounded-lg bg-muted/35 p-3"
              >
                <step.icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  stroke={1.5}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </section>
  );
}

function InstallCard({
  title,
  description,
  href,
  cta,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
}) {
  const isPlaceholder = href.startsWith("#");

  return (
    <Card size="sm">
      <CardHeader>
        <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <a
          href={href}
          target={isPlaceholder ? undefined : "_blank"}
          rel={isPlaceholder ? undefined : "noreferrer"}
          className={buttonVariants({
            variant: isPlaceholder ? "outline" : "default",
          })}
        >
          {cta}
          <IconArrowRight className="size-4" stroke={1.5} />
        </a>
      </CardContent>
    </Card>
  );
}
