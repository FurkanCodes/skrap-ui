import AppLoadingScreen from "@/components/layout/app-loading-screen";

export default function WorkspaceShellFallback() {
  return (
    <AppLoadingScreen
      message="Loading workspace..."
      detail="Preparing trackers and alerts"
    />
  );
}
