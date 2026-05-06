import AppLoadingScreen from "@/components/layout/app-loading-screen";
import { getMessages } from "@/lib/messages";

export default function WorkspaceShellFallback() {
  const t = getMessages("common.loading");

  return (
    <AppLoadingScreen
      message={t("workspaceMessage")}
      detail={t("workspaceDetail")}
    />
  );
}
