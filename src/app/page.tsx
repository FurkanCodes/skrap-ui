import { Globe, Radar, ScanSearch } from "lucide-react";

import AppSidebar from "@/components/layout/app-sidebar";
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <section className="space-y-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Skrap Console</h1>
            <p className="text-sm text-muted-foreground">
              Run scraping and discovery jobs, then inspect normalized results in one place.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {dashboardStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <ScraperConsole />
      </div>
    </AppSidebar>
  );
}
