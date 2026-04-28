import {
  ArrowRight,
  Download,
  Globe2,
  KeyRound,
  Puzzle,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

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
      icon: Download,
      title: t("steps.install.title"),
      description: t("steps.install.description"),
    },
    {
      icon: KeyRound,
      title: t("steps.connect.title"),
      description: t("steps.connect.description"),
    },
    {
      icon: Puzzle,
      title: t("steps.track.title"),
      description: t("steps.track.description"),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Puzzle className="size-3.5" />
          {t("eyebrow")}
        </div>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InstallCard
          title={t("chrome.title")}
          description={t("chrome.description")}
          href={chromeUrl}
          cta={t("chrome.cta")}
          icon={<Globe2 className="size-5" />}
        />
        <InstallCard
          title={t("firefox.title")}
          description={t("firefox.description")}
          href={firefoxUrl}
          cta={t("firefox.cta")}
          icon={<Puzzle className="size-5" />}
        />
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{t("howItWorks")}</CardTitle>
          <CardDescription>{t("howItWorksDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-lg border border-border/80 bg-background p-4"
              >
                <step.icon className="mb-3 size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 pt-0 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{t("auth.title")}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("auth.description")}
              </p>
            </div>
          </div>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            {t("auth.dashboard")}
            <ArrowRight className="size-4" />
          </Link>
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
    <Card className="rounded-lg">
      <CardHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
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
          <ArrowRight className="size-4" />
        </a>
      </CardContent>
    </Card>
  );
}
