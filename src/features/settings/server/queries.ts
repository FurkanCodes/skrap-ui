import "server-only";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import type { SiteInfoResponse, SitesResponse } from "@/features/scraper/types";

export async function listSupportedSitesQuery(): Promise<SiteInfoResponse[]> {
  const response = await getBackendJson<SitesResponse>("/api/v1/sites", {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  return response.sites
    .filter((site) => site.key.trim().length > 0)
    .sort((left, right) => left.key.localeCompare(right.key));
}
