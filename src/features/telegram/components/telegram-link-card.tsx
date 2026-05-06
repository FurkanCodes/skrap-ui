"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  IconCircleCheck,
  IconExternalLink,
  IconLink,
  IconLoader2,
  IconMessageCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TelegramStatusChip } from "@/features/telegram/components/telegram-status-chip";
import {
  checkTelegramConnectStatusAction,
  refreshTelegramStatusAction,
  startTelegramConnectAction,
} from "@/features/telegram/server/actions";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useOptionalWorkspaceData } from "@/features/workspace-data/workspace-data-provider";
import { Link } from "@/i18n/navigation";

interface TelegramLinkCardProps {
  isAuthenticated: boolean;
  initialStatus: TelegramActiveStatusResponse | null;
  initialError: string | null;
}

interface PendingConnectSession {
  state: string;
  expiresAt: string;
  deepLinkUrl: string;
  botUsername: string;
}

interface QrCodeSnapshot {
  target: string;
  dataUrl: string;
}

function mapError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

function normalizeBotUsername(botUsername: string | null | undefined): string {
  return (botUsername ?? "").trim().replace(/^@/, "");
}

function parseAllowedChannels(value: string | null | undefined): string[] {
  const raw = value?.trim() ?? "";
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter((channel) => channel.length > 0);
}

function formatExpiry(expiresAt: string | null, locale: string, unknownExpiry: string): string {
  if (!expiresAt) {
    return unknownExpiry;
  }
  const asDate = new Date(expiresAt);
  if (Number.isNaN(asDate.valueOf())) {
    return unknownExpiry;
  }
  return asDate.toLocaleString(locale);
}

export function TelegramLinkCard({
  isAuthenticated,
  initialStatus,
  initialError,
}: TelegramLinkCardProps) {
  const t = useTranslations("telegram");
  const locale = useLocale();
  const { me } = useViewer();
  const workspaceData = useOptionalWorkspaceData();
  const setTelegramStatus = workspaceData?.patchers.setTelegramStatus;
  const loadTelegramStatus = workspaceData?.refreshers.loadTelegramStatus;
  const [status, setStatus] = useState<TelegramActiveStatusResponse | null>(initialStatus);
  const [baseError, setBaseError] = useState<string | null>(initialError);
  const [pendingSession, setPendingSession] = useState<PendingConnectSession | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeSnapshot | null>(null);
  const [flowMessage, setFlowMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"connect" | "refresh" | null>(null);
  const [isPending, startTransition] = useTransition();

  const allowedChannels = me?.entitlement.allowed_channels ?? "";
  const allowsTelegram = useMemo(() => {
    const channels = parseAllowedChannels(allowedChannels);
    if (channels.length === 0) {
      return null;
    }
    return channels.includes("telegram");
  }, [allowedChannels]);

  const botUsername = useMemo(
    () => normalizeBotUsername(pendingSession?.botUsername ?? status?.bot_username ?? ""),
    [pendingSession?.botUsername, status?.bot_username]
  );
  const botDeepLink = botUsername ? `https://t.me/${botUsername}` : null;
  const qrTargetUrl = pendingSession?.deepLinkUrl ?? null;
  const qrCodeDataUrl =
    qrTargetUrl && qrCode?.target === qrTargetUrl && qrCode.dataUrl ? qrCode.dataUrl : null;
  const isConnected = Boolean(status?.connected);
  const isRefreshing = isPending && pendingAction === "refresh";
  const isCreatingLink = isPending && pendingAction === "connect";
  const displayError = actionError ?? baseError;

  const startConnect = () => {
    setFlowMessage(null);
    setActionError(null);
    setBaseError(null);
    setPendingAction("connect");

    startTransition(async () => {
      try {
        const response = await startTelegramConnectAction();
        const nextSession: PendingConnectSession = {
          state: response.state,
          expiresAt: response.expires_at,
          deepLinkUrl: response.deep_link_url,
          botUsername: response.bot_username,
        };

        setPendingSession(nextSession);
        setFlowMessage(t("flow.qrReady"));
      } catch (error) {
        setActionError(mapError(error, t("errors.fallback")));
      } finally {
        setPendingAction(null);
      }
    });
  };

  const refreshStatus = () => {
    setFlowMessage(null);
    setActionError(null);
    setBaseError(null);
    setPendingAction("refresh");

    startTransition(async () => {
      try {
        const latest = await refreshTelegramStatusAction();
        setStatus(latest);
        setTelegramStatus?.(latest);
        if (latest.connected) {
          setPendingSession(null);
        }
      } catch (error) {
        setActionError(mapError(error, t("errors.fallback")));
        void loadTelegramStatus?.({ force: true });
      } finally {
        setPendingAction(null);
      }
    });
  };

  useEffect(() => {
    if (!qrTargetUrl) {
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(qrTargetUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
    })
      .then((dataUrl) => {
        if (cancelled) {
          return;
        }
        setQrCode({ target: qrTargetUrl, dataUrl });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setQrCode({ target: qrTargetUrl, dataUrl: "" });
      });

    return () => {
      cancelled = true;
    };
  }, [qrTargetUrl]);

  useEffect(() => {
    if (!pendingSession) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    const poll = async () => {
      if (cancelled) {
        return;
      }

      const expiresAtMs = Date.parse(pendingSession.expiresAt);
      if (Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()) {
        setPendingSession(null);
        setFlowMessage(t("flow.sessionExpired"));
        return;
      }

      try {
        const response = await checkTelegramConnectStatusAction(pendingSession.state);
        if (cancelled) {
          return;
        }

        if (response.status === "connected") {
          const nextStatus: TelegramActiveStatusResponse = {
            connected: true,
            active_chat_id: response.telegram_chat_id,
            bot_username: pendingSession.botUsername || status?.bot_username || "",
          };
          setStatus((current) => ({
            ...nextStatus,
            bot_username: pendingSession.botUsername || current?.bot_username || nextStatus.bot_username,
          }));
          setTelegramStatus?.(nextStatus);
          setPendingSession(null);
          setActionError(null);
          setBaseError(null);
          setFlowMessage(
            response.telegram_username
              ? t("flow.connectedAs", { username: response.telegram_username })
              : t("flow.connected")
          );
          return;
        }

        if (response.status === "expired") {
          setPendingSession(null);
          setFlowMessage(t("flow.sessionExpired"));
          return;
        }

        timeoutId = window.setTimeout(poll, 3000);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setActionError(mapError(error, t("errors.fallback")));
        timeoutId = window.setTimeout(poll, 5000);
      }
    };

    timeoutId = window.setTimeout(poll, 1000);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [loadTelegramStatus, pendingSession, setTelegramStatus, status?.bot_username, t]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("unauthenticated.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "sm" })}>
            {t("unauthenticated.cta")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl bg-card/95">
      <CardHeader className="gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t("title")}</CardTitle>
            <TelegramStatusChip
              connected={isConnected}
              connectedLabel={t("connected")}
              disconnectedLabel={t("notLinked")}
            />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={refreshStatus}
          disabled={isPending}
          className="justify-self-start sm:justify-self-end"
        >
          {isRefreshing ? (
            <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
          ) : (
            <IconRefresh className="size-3.5" stroke={1.5} />
          )}
          {t("actions.refresh")}
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4">
        {displayError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {displayError}
          </p>
        ) : null}

        {allowsTelegram === false ? (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {t("entitlementMissing")}
          </p>
        ) : null}

        {isConnected || pendingSession ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {status?.active_chat_id ? <Chip tone="muted">Chat {status.active_chat_id}</Chip> : null}
            {botUsername ? <Chip tone="muted">@{botUsername}</Chip> : null}
            {pendingSession ? (
              <Chip tone="muted" className="gap-1">
                <IconLoader2 className="size-3 animate-spin" stroke={1.5} />
                {t("waitingStart")}
              </Chip>
            ) : null}
          </div>
        ) : null}

        {qrTargetUrl ? (
          <div className="grid gap-5 rounded-2xl bg-muted/20 p-4 md:grid-cols-[auto_1fr] md:items-center">
            <div className="grid place-items-center rounded-2xl bg-background p-3 shadow-sm ring-1 ring-foreground/10">
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt="Telegram connect QR code"
                  width={160}
                  height={160}
                  unoptimized
                />
              ) : (
                <div className="grid h-40 w-40 place-items-center">
                  <IconLoader2 className="size-5 animate-spin text-muted-foreground" stroke={1.5} />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{t("linkReady.title")}</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t("linkReady.description")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href={qrTargetUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
                  <IconExternalLink className="size-3.5" stroke={1.5} />
                  {t("actions.openTelegram")}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startConnect}
                  disabled={isPending || allowsTelegram === false}
                >
                  {isCreatingLink ? (
                    <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
                  ) : (
                    <IconRefresh className="size-3.5" stroke={1.5} />
                  )}
                  {t("actions.newLink")}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("expires", {
                  value: formatExpiry(pendingSession?.expiresAt ?? null, locale, t("unknownExpiry")),
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 rounded-2xl bg-muted/20 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-foreground shadow-sm ring-1 ring-foreground/10">
                {isConnected ? (
                  <IconCircleCheck className="size-5" stroke={1.5} />
                ) : (
                  <IconMessageCircle className="size-5" stroke={1.5} />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isConnected ? t("linkedTitle") : t("connectTitle")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                size="sm"
                onClick={startConnect}
                disabled={isPending || allowsTelegram === false}
              >
                {isCreatingLink ? (
                  <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
                ) : (
                  <IconLink className="size-3.5" stroke={1.5} />
                )}
                {isConnected ? t("actions.showRelinkQr") : t("actions.showQr")}
              </Button>

              {isConnected && botDeepLink ? (
                <a href={botDeepLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <IconExternalLink className="size-3.5" stroke={1.5} />
                  {t("actions.openBot", { username: botUsername })}
                </a>
              ) : null}
            </div>
          </div>
        )}

        {flowMessage ? (
          <p className="rounded-xl bg-muted/20 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/10">
            {flowMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
