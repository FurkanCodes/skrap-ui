import "server-only";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import type { BillingCurrentResponse } from "@/features/billing/types";

export async function getBillingCurrentQuery(): Promise<BillingCurrentResponse> {
  return getBackendJson<BillingCurrentResponse>("/api/v1/billing/current", {
    auth: true,
    cache: "no-store",
  });
}
