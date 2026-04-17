import { Globe, Radar, ScanSearch } from "lucide-react";

import AppSidebar from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FETCH_MODES } from "@/features/scraper/constants";
import { ScraperConsole } from "@/features/scraper/components/scraper-console";

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

export default function HomePage() {
  return (
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
  );
}
