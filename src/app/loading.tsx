import AppLoadingScreen from "@/components/layout/app-loading-screen";
import { getMessages } from "@/lib/messages";

export default function Loading() {
  const t = getMessages("common.loading");

  return <AppLoadingScreen message={t("pageMessage")} detail={t("pageDetail")} />;
}
