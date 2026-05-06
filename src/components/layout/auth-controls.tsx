"use client";

import { useState, useTransition } from "react";
import {
  IconArticle,
  IconBook,
  IconEye,
  IconHome,
  IconLoader2,
  IconLogin,
  IconLogout,
  IconMail,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TelegramStatusChip } from "@/features/telegram/components/telegram-status-chip";
import { clearViewerCache } from "@/features/tracking/viewer/viewer-cache";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useOptionalWorkspaceData } from "@/features/workspace-data/workspace-data-provider";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthControls() {
  const t = useTranslations("layout.auth");
  const telegramT = useTranslations("telegram");
  const locale = useLocale();
  const router = useRouter();
  const authSession = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { isAuthenticated, me, sessionPending, sessionUser } = useViewer();
  const workspaceData = useOptionalWorkspaceData();
  const authUser = authSession.data?.user;
  const displayName =
    authUser?.name ??
    sessionUser?.name ??
    me?.user.display_name ??
    authUser?.email ??
    sessionUser?.email ??
    me?.user.email ??
    t("signedIn");
  const emailLabel =
    authUser?.email ?? sessionUser?.email ?? me?.user.email ?? t("account");
  const avatarLabel = (displayName || emailLabel).trim().slice(0, 1).toUpperCase() || "U";
  const avatarUrl =
    typeof authUser?.image === "string" && authUser.image.trim()
      ? authUser.image
      : sessionUser?.image ?? null;
  const consumedCredits = Math.max(0, Number(me?.usage.consumed_check_units) || 0);
  const monthlyCredits = Math.max(
    0,
    Number(me?.usage.monthly_check_units ?? me?.entitlement.monthly_check_units) || 0
  );
  const remainingCredits = Math.max(
    0,
    Number(me?.usage.remaining_check_units ?? monthlyCredits - consumedCredits) || 0
  );
  const hasUsage = Boolean(me);
  const hasUnlimitedCredits = hasUsage && (monthlyCredits <= 0 || monthlyCredits >= 1_000_000);
  const creditProgress = !hasUsage
    ? 0
    : hasUnlimitedCredits
      ? 4
      : Math.min(100, Math.max(0, Math.round((consumedCredits / monthlyCredits) * 100)));
  const remainingLabel = !hasUsage
    ? "Checking"
    : hasUnlimitedCredits
      ? "Unlimited"
      : formatCount(remainingCredits, locale);
  const limitLabel = hasUnlimitedCredits
    ? "Unlimited"
    : formatCount(monthlyCredits, locale);
  const consumedLabel = formatCount(consumedCredits, locale);
  const resetLabel = formatPeriodEnd(me?.usage.period_end ?? null, locale);
  const planKey = me?.entitlement.plan_key ?? "free";
  const planLabel = hasUsage ? formatPlanLabel(planKey) : null;
  const upgradePlan = planKey === "pro" ? null : planKey === "plus" ? "pro" : "plus";
  const telegramConnected = workspaceData?.telegramStatus.data?.connected ?? null;
  const sessionLoading = sessionPending || authSession.isPending;

  const signOut = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        clearViewerCache();
        const response = await authClient.signOut();
        if (response.error) {
          setStatusMessage(
            typeof response.error.message === "string" && response.error.message.trim()
              ? response.error.message
              : t("errors.requestFailed")
          );
          return;
        }
        router.replace("/");
        router.refresh();
      } catch (error) {
        setStatusMessage(
          error instanceof Error && error.message.trim()
            ? error.message
            : t("errors.requestFailed")
        );
      }
    });
  };

  const goTo = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group relative inline-flex h-10 w-14 items-center justify-end rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
            disabled={isPending || sessionLoading}
            aria-label={t("openMenu")}
          >
            <Avatar className="absolute left-0 size-[30px] bg-background shadow-[0_0_0_2px_var(--background)]">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback>{avatarLabel}</AvatarFallback>
            </Avatar>
            <span className="grid size-[30px] place-items-center rounded-full bg-muted text-sm font-medium text-muted-foreground shadow-[0_0_0_2px_var(--background)] transition-colors group-hover:bg-muted/70">
              {isPending || sessionLoading ? (
                <IconLoader2 className="size-4 animate-spin" stroke={1.5} />
              ) : (
                avatarLabel
              )}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={14}
            className="w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-[22px] border-border/70 bg-popover p-0 text-popover-foreground shadow-[0_22px_46px_-24px_rgb(24_25_37_/_0.48),0_2px_10px_rgb(24_25_37_/_0.08)] dark:shadow-[0_22px_46px_-24px_rgb(0_0_0_/_0.7),0_0_0_1px_rgb(255_255_255_/_0.04)] sm:w-[22rem]"
          >
            <div className="p-6 pb-5">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-11">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                  <AvatarFallback>{avatarLabel}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h6 className="truncate text-[18px] font-semibold leading-6 text-foreground">
                    {displayName}
                  </h6>
                  <p className="truncate text-[16px] leading-6 text-muted-foreground">
                    {emailLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h5 className="text-[16px] font-semibold leading-5 text-foreground">
                    Credits remaining
                  </h5>
                  <span className="text-[16px] leading-5">
                    <span className="font-medium text-foreground">{remainingLabel}</span>
                    {hasUsage && !hasUnlimitedCredits ? (
                      <span className="text-muted-foreground"> / {limitLabel}</span>
                    ) : null}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-radiant-violet transition-[width] duration-200"
                    style={{ width: `${creditProgress}%` }}
                  />
                </div>
                <p className="text-[15px] leading-6 text-muted-foreground">
                  {planLabel
                    ? `${planLabel} plan. ${consumedLabel} credits used this cycle${
                        resetLabel ? `, resets ${resetLabel}` : ""
                      }.`
                    : "Checking your plan and usage."}{" "}
                  {hasUsage && upgradePlan ? (
                    <button
                      type="button"
                      onClick={() => goTo(`/billing/checkout?plan=${upgradePlan}`)}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Upgrade
                    </button>
                  ) : null}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2.5 ring-1 ring-border/50 dark:bg-muted/20">
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  Telegram alerts
                </span>
                <TelegramStatusChip
                  connected={telegramConnected}
                  connectedLabel={telegramT("connected")}
                  disconnectedLabel={telegramT("notLinked")}
                  pendingLabel="Checking"
                />
              </div>
            </div>

            <DropdownMenuGroup className="px-4 pb-4">
              <AccountMenuItem
                label="Account"
                icon={IconSettings}
                onClick={() => goTo("/settings")}
              />
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="mx-0 my-0 bg-border/70" />

            <DropdownMenuGroup className="space-y-1 px-4 py-4">
              <AccountMenuItem label="Docs" icon={IconBook} onClick={() => goTo("/terms")} />
              <AccountMenuItem label="Blog" icon={IconArticle} onClick={() => goTo("/")} />
              <AccountMenuItem
                label="Contact"
                icon={IconMail}
                onClick={() => window.location.assign("mailto:support@dealvinci.com")}
              />
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="mx-0 my-0 bg-border/70" />

            <DropdownMenuGroup className="space-y-1 px-4 py-4">
              <AccountMenuItem label="Homepage" icon={IconEye} onClick={() => goTo("/")} />
              <AccountMenuItem
                label="Log out"
                icon={isPending ? IconLoader2 : IconLogout}
                onClick={signOut}
                disabled={isPending}
                iconClassName={isPending ? "animate-spin" : undefined}
              />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Link
            href="/auth/sign-in"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconLogin className="size-3.5" stroke={1.5} />
            {t("signIn")}
          </Link>
          <Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>
            <IconUserPlus className="size-3.5" stroke={1.5} />
            {t("signUp")}
          </Link>
        </>
      )}

      {statusMessage ? (
        <p className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

function AccountMenuItem({
  disabled,
  icon: Icon,
  iconClassName,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: typeof IconHome;
  iconClassName?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      className="min-h-10 rounded-xl px-2 py-2 text-[18px] font-semibold leading-6 text-foreground focus:bg-muted/70 [&_svg]:text-muted-foreground"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flex w-full items-center justify-between gap-4">
        <span>{label}</span>
        <Icon className={iconClassName} stroke={1.7} />
      </span>
    </DropdownMenuItem>
  );
}

function formatCount(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

function formatPeriodEnd(value: string | null, locale: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatPlanLabel(value: string | null): string {
  if (!value) {
    return "Free";
  }

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
