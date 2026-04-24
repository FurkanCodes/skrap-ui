import { getTranslations } from "next-intl/server";

import AppLoadingScreen from "@/components/layout/app-loading-screen";

export default async function WorkspaceShellFallback() {
  const t = await getTranslations("common.loading");

  return (
    <AppLoadingScreen
      message={t("workspaceMessage")}
      detail={t("workspaceDetail")}
    />
  );
}
