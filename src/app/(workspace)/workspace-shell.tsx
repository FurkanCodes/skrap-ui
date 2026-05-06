"use client";

import AppSidebar from "@/components/layout/app-sidebar";
import { ViewerProvider, useViewer } from "@/features/tracking/viewer/viewer-provider";
import { WorkspaceDataProvider } from "@/features/workspace-data/workspace-data-provider";

export default function WorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewerProvider
      initialMe={null}
      initialUserKey={null}
      initialSessionUser={null}
      initialAuthState="authenticated"
    >
      <WorkspaceDataBoundary>
        <AppSidebar>
          <div className="min-h-screen bg-background">{children}</div>
        </AppSidebar>
      </WorkspaceDataBoundary>
    </ViewerProvider>
  );
}

function WorkspaceDataBoundary({ children }: { children: React.ReactNode }) {
  const { userKey } = useViewer();

  return (
    <WorkspaceDataProvider initialUserKey={userKey}>
      {children}
    </WorkspaceDataProvider>
  );
}
