import AppSidebar from "@/components/layout/app-sidebar";
import { ViewerProvider } from "@/features/tracking/viewer/viewer-provider";
import { getViewerBootstrap } from "@/lib/viewer-bootstrap";

export default async function WorkspaceShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bootstrap = await getViewerBootstrap();

  return (
    <ViewerProvider
      initialMe={bootstrap.initialMe}
      initialUserKey={bootstrap.initialUserKey}
      initialSessionUser={bootstrap.initialSessionUser}
    >
      <AppSidebar>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8)_0%,_rgba(244,245,249,1)_45%,_rgba(244,245,249,1)_100%)]">
          {children}
        </div>
      </AppSidebar>
    </ViewerProvider>
  );
}
