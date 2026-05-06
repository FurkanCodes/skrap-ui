import { Suspense } from "react";

import {
  DashboardPageClient,
  DashboardRouteFallback,
} from "@/app/(workspace)/dashboard/dashboard-page-client";

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardRouteFallback />}>
      <DashboardPageClient />
    </Suspense>
  );
}
