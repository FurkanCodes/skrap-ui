import { redirect } from "next/navigation";

import AppSidebar from "@/components/layout/app-sidebar";
import { ViewerProvider } from "@/features/tracking/viewer/viewer-provider";
import { WorkspaceDataProvider } from "@/features/workspace-data/workspace-data-provider";
import { getViewerBootstrap } from "@/lib/viewer-bootstrap";

export default async function WorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bootstrap = await getViewerBootstrap();
  if (!bootstrap.initialUserKey) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  return (
    <ViewerProvider
      initialMe={bootstrap.initialMe}
      initialUserKey={bootstrap.initialUserKey}
      initialSessionUser={bootstrap.initialSessionUser}
    >
      <WorkspaceDataProvider initialUserKey={bootstrap.initialUserKey}>
        <AppSidebar>
          <div className="min-h-screen bg-background">{children}</div>
        </AppSidebar>
      </WorkspaceDataProvider>
    </ViewerProvider>
  );
}
