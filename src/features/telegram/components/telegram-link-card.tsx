"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Link2, Loader2, RefreshCw } from "lucide-react";
import QRCode from "qrcode";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkTelegramConnectStatusAction,
  refreshTelegramStatusAction,
  startTelegramConnectAction,
} from "@/features/telegram/server/actions";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

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

function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Request failed.";
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

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return "Unknown expiry";
  }
  const asDate = new Date(expiresAt);
  if (Number.isNaN(asDate.valueOf())) {
    return "Unknown expiry";
  }
  return asDate.toLocaleString();
}

export function TelegramLinkCard({
  isAuthenticated,
  initialStatus,
  initialError,
}: TelegramLinkCardProps) {
  const { me } = useViewer();
  const [status, setStatus] = useState<TelegramActiveStatusResponse | null>(initialStatus);
  const [baseError, setBaseError] = useState<string | null>(initialError);
  const [pendingSession, setPendingSession] = useState<PendingConnectSession | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeSnapshot | null>(null);
  const [flowMessage, setFlowMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
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
  const isRefreshing = isPending && !pendingSession;
  const displayError = actionError ?? baseError;

  const startConnect = () => {
    setFlowMessage(null);
    setActionError(null);
    setBaseError(null);

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
        setFlowMessage("Connect link ready. Open bot and tap Start.");

        const popup = window.open(response.deep_link_url, "_blank", "noopener,noreferrer");
        if (!popup) {
          setFlowMessage("Connect link ready. Pop-up blocked, open with button below.");
        }
      } catch (error) {
        setActionError(mapError(error));
      }
    });
  };

  const refreshStatus = () => {
    setFlowMessage(null);
    setActionError(null);
    setBaseError(null);

    startTransition(async () => {
      try {
        const latest = await refreshTelegramStatusAction();
        setStatus(latest);
        if (latest.connected) {
          setPendingSession(null);
        }
      } catch (error) {
        setActionError(mapError(error));
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
        setFlowMessage("Connect session expired. Start a new link.");
        return;
      }

      setIsPolling(true);
      try {
        const response = await checkTelegramConnectStatusAction(pendingSession.state);
        if (cancelled) {
          return;
        }

        if (response.status === "connected") {
          setStatus((current) => ({
            connected: true,
            active_chat_id: response.telegram_chat_id,
            bot_username: pendingSession.botUsername || current?.bot_username || "",
          }));
          setPendingSession(null);
          setActionError(null);
          setBaseError(null);
          setFlowMessage(
            response.telegram_username
              ? `Connected as @${response.telegram_username}. Alerts now route to Telegram.`
              : "Telegram connected. Alerts now route to Telegram."
          );
          return;
        }

        if (response.status === "expired") {
          setPendingSession(null);
          setFlowMessage("Connect session expired. Start a new link.");
          return;
        }

        timeoutId = window.setTimeout(poll, 3000);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setActionError(mapError(error));
        timeoutId = window.setTimeout(poll, 5000);
      } finally {
        if (!cancelled) {
          setIsPolling(false);
        }
      }
    };

    timeoutId = window.setTimeout(poll, 1000);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pendingSession]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram alerts</CardTitle>
          <CardDescription>
            Sign in to link your Telegram bot chat and receive tracking notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in?next=/dashboard" className={buttonVariants({ size: "sm" })}>
            Sign in to link Telegram
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Telegram alerts</CardTitle>
          <CardDescription>
            Link your Telegram chat. Scheduler delivers alert notifications to linked bot chat.
          </CardDescription>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={refreshStatus} disabled={isPending}>
          {isRefreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="grid gap-3">
        {displayError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {displayError}
          </p>
        ) : null}

        {allowsTelegram === false ? (
          <p className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Current entitlement does not include Telegram channel.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isConnected ? "secondary" : "outline"}>
            {isConnected ? "Connected" : "Not linked"}
          </Badge>
          {status?.active_chat_id ? <Badge variant="outline">Chat {status.active_chat_id}</Badge> : null}
          {botUsername ? <Badge variant="outline">@{botUsername}</Badge> : null}
          {isPolling ? (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="size-3 animate-spin" />
              Waiting for Telegram start
            </Badge>
          ) : null}
        </div>

        {pendingSession ? (
          <p className="text-xs text-muted-foreground">
            Connect session expires at {formatExpiry(pendingSession.expiresAt)}.
          </p>
        ) : null}

        {!pendingSession ? (
          <p className="text-xs text-muted-foreground">
            Click <strong>Link Telegram</strong> to generate one-time QR code with connect state.
          </p>
        ) : null}

        {qrTargetUrl ? (
          <div className="grid gap-2 rounded-md border bg-muted/10 p-3 md:grid-cols-[auto_1fr] md:items-center">
            <div className="grid place-items-center rounded-md border bg-background p-2">
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
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Scan QR on mobile</p>
              <p className="text-xs text-muted-foreground">
                Opens Telegram bot chat directly. Then tap Start to finish link.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={startConnect} disabled={isPending || allowsTelegram === false}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
            {isConnected ? "Relink Telegram" : "Link Telegram"}
          </Button>

          {pendingSession?.deepLinkUrl ? (
            <Link
              href={pendingSession.deepLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="size-3.5" />
              Open connect link
            </Link>
          ) : botDeepLink ? (
            <Link
              href={botDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="size-3.5" />
              Open @{botUsername}
            </Link>
          ) : null}
        </div>

        {flowMessage ? (
          <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {flowMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
