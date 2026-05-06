"use client";

import { getMessages } from "@/lib/messages";
import { useState } from "react";
import {
  IconBell,
  IconBrandDiscord,
  IconBrandSlack,
  IconClock,
  IconVolumeOff,
} from "@tabler/icons-react";

import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TelegramLinkCard } from "@/features/telegram/components/telegram-link-card";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useWorkspaceData } from "@/features/workspace-data/workspace-data-provider";

export function NotificationsPageClient() {
  const t = getMessages("settings.notifications");
  const pageT = getMessages("notificationsPage");
  const { isAuthenticated } = useViewer();
  const { telegramStatus } = useWorkspaceData();
  const [dailySummary, setDailySummary] = useState(true);
  const [muteWeekends, setMuteWeekends] = useState(false);
  const [minimumDrop, setMinimumDrop] = useState("1");
  const minimumDropOptions = [
    { value: "1", label: "1%" },
    { value: "3", label: "3%" },
    { value: "5", label: "5%" },
    { value: "10", label: "10%" },
  ];

  return (
    <div className="space-y-5">
      <TelegramLinkCard
        isAuthenticated={isAuthenticated}
        initialStatus={telegramStatus.data}
        initialError={telegramStatus.error}
      />

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PreferenceRow
            icon={<IconClock className="size-4" stroke={1.5} />}
            title={t("dailySummary")}
            description={t("dailySummaryDescription")}
            control={
              <Checkbox
                checked={dailySummary}
                onCheckedChange={(checked) => setDailySummary(Boolean(checked))}
              />
            }
          />

          <PreferenceRow
            icon={<IconVolumeOff className="size-4" stroke={1.5} />}
            title={t("muteWeekends")}
            description={t("muteWeekendsDescription")}
            control={
              <Checkbox
                checked={muteWeekends}
                onCheckedChange={(checked) => setMuteWeekends(Boolean(checked))}
              />
            }
          />

          <PreferenceRow
            icon={<IconBell className="size-4" stroke={1.5} />}
            title={t("minDrop")}
            description={t("minDropDescription")}
            control={
              <AnimatedDropdown
                value={minimumDrop}
                onValueChange={setMinimumDrop}
                options={minimumDropOptions}
                className="w-28"
              />
            }
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{pageT("channels.title")}</CardTitle>
          <CardDescription>{pageT("channels.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <FutureChannel
            icon={<IconBrandDiscord className="size-4" stroke={1.5} />}
            title={pageT("channels.discord")}
            status={pageT("channels.comingSoon")}
          />
          <FutureChannel
            icon={<IconBrandSlack className="size-4" stroke={1.5} />}
            title={pageT("channels.slack")}
            status={pageT("channels.comingSoon")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {control}
    </label>
  );
}

function FutureChannel({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-md bg-background text-muted-foreground">
          {icon}
        </span>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground">{status}</span>
    </div>
  );
}
