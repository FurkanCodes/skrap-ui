import { Suspense } from "react";

import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import { SettingsQueryRedirect } from "@/features/settings/components/settings-query-redirect";

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SettingsQueryRedirect />
      </Suspense>
      <SettingsPageClient />
    </>
  );
}
