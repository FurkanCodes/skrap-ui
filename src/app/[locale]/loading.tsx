import { getTranslations } from "next-intl/server";

import AppLoadingScreen from "@/components/layout/app-loading-screen";

export default async function Loading() {
  const t = await getTranslations("common.loading");

  return <AppLoadingScreen message={t("pageMessage")} detail={t("pageDetail")} />;
}
