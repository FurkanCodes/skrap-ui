import {
  IconArrowRight,
  IconDownload,
  IconKey,
  IconPuzzle,
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

const DEFAULT_CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/dealvinci/jdppfcpgnaghmpbiallcdgijcccieicp";
const DEFAULT_FIREFOX_EXTENSION_URL =
  "https://addons.mozilla.org/en-US/firefox/addon/dealvinci/";

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
          icon={<ChromeLogoMark />}
        />
        <InstallCard
          title={t("firefox.title")}
          description={t("firefox.description")}
          href={firefoxUrl}
          cta={t("firefox.cta")}
          icon={<FirefoxLogoMark />}
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
    <Card size="sm" className="h-full">
      <CardHeader className="flex h-full min-h-[132px] flex-col gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="leading-tight">{title}</CardTitle>
            <CardDescription className="mt-1 leading-5">
              {description}
            </CardDescription>
          </div>
        </div>
        <a
          href={href}
          target={isPlaceholder ? undefined : "_blank"}
          rel={isPlaceholder ? undefined : "noreferrer"}
          className={buttonVariants({
            variant: isPlaceholder ? "outline" : "default",
            className: "mt-auto self-end",
          })}
        >
          {cta}
          <IconArrowRight className="size-4" stroke={1.5} />
        </a>
      </CardHeader>
    </Card>
  );
}

function ChromeLogoMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M12 9h8.4" />
      <path d="M14.598 13.5l-4.2 7.275" />
      <path d="M9.402 13.5l-4.2 -7.275" />
    </svg>
  );
}

function FirefoxLogoMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.028 7.82a9 9 0 1 0 12.823 -3.4c-1.636 -1.02 -3.064 -1.02 -4.851 -1.02h-1.647"
      />
      <path
        d="M4.914 9.485c-1.756 -1.569 -.805 -5.38 .109 -6.17c.086 .896 .585 1.208 1.111 1.685c.88 -.275 1.313 -.282 1.867 0c.82 -.91 1.694 -2.354 2.628 -2.093c-1.082 1.741 -.07 3.733 1.371 4.173c-.17 .975 -1.484 1.913 -2.76 2.686c-1.296 .938 -.722 1.85 0 2.234c.949 .506 3.611 -1 4.545 .354c-1.698 .102 -1.536 3.107 -3.983 2.727c2.523 .957 4.345 .462 5.458 -.34c1.965 -1.52 2.879 -3.542 2.879 -5.557c-.014 -1.398 .194 -2.695 -1.26 -4.75"
      />
    </svg>
  );
}
