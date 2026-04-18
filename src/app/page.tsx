import { Globe, Radar, ScanSearch } from "lucide-react";
import { headers } from "next/headers";
import { createHash } from "crypto";

import AppSidebar from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FETCH_MODES } from "@/features/scraper/constants";
import { ScraperConsole } from "@/features/scraper/components/scraper-console";
import { TrackedItemsPanel } from "@/features/tracking/components/tracked-items-panel";
import { getMeQuery } from "@/features/tracking/server/queries";
import type { MeResponse } from "@/features/tracking/types";
import { ViewerProvider } from "@/features/tracking/viewer/viewer-provider";
import { getAuth } from "@/lib/auth";

const dashboardStats = [
  {
    icon: Globe,
    title: "Endpoints",
    value: "2",
    description: "Scrapes and discover APIs in one console",
  },
  {
    icon: Radar,
    title: "Fetch Modes",
    value: String(FETCH_MODES.length),
    description: "auto, http, dynamic, and stealth",
  },
  {
    icon: ScanSearch,
    title: "Batch Ready",
    value: "Multi-URL",
    description: "Paste space/newline-separated product URLs",
  },
];

function getSessionUserKey(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown; email?: unknown; name?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email;
  }

  if (typeof user.name === "string" && user.name.trim().length > 0) {
    return user.name;
  }

  return null;
}

function getSessionMeCacheKey(session: unknown, sessionUserKey: string | null): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const maybeSession = (session as { session?: { id?: unknown; token?: unknown } }).session;
  if (maybeSession && typeof maybeSession === "object") {
    if (typeof maybeSession.id === "string" && maybeSession.id.trim().length > 0) {
      return `sid:${maybeSession.id}`;
    }

    if (typeof maybeSession.token === "string" && maybeSession.token.trim().length > 0) {
      return `tok:${createHash("sha256").update(maybeSession.token).digest("hex")}`;
    }
  }

  if (sessionUserKey) {
    return `usr:${sessionUserKey}`;
  }

  return null;
}

export default async function HomePage() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });
  const sessionUserKey = getSessionUserKey(session);
  const meCacheKey = getSessionMeCacheKey(session, sessionUserKey);

  let initialMe: MeResponse | null = null;
  if (sessionUserKey) {
    try {
      initialMe = await getMeQuery({ cacheKey: meCacheKey });
    } catch {
      initialMe = null;
    }
  }

  const initialUserKey = initialMe?.user.user_id ?? sessionUserKey;

  return (
    <ViewerProvider initialMe={initialMe} initialUserKey={initialUserKey}>
      <AppSidebar>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
          <section className="grid gap-4 rounded-xl border border-border/70 bg-muted/15 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Skrap Console</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Run scraping and discovery jobs, then inspect normalized results in one place.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">1. Pick job type</Badge>
                <Badge variant="secondary">2. Paste URLs</Badge>
                <Badge variant="secondary">3. Run and review</Badge>
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Single-workspace flow
            </p>
          </section>

          <ScraperConsole />
          <TrackedItemsPanel />

          <section className="grid gap-3 md:grid-cols-3">
            {dashboardStats.map((stat) => (
              <Card key={stat.title} size="sm" className="bg-muted/10">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold tracking-tight">{stat.value}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </AppSidebar>
    </ViewerProvider>
  );
}
