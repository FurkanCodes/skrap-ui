import AppSidebar from "@/components/layout/app-sidebar";
import { ViewerProvider } from "@/features/tracking/viewer/viewer-provider";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { getViewerBootstrap } from "@/lib/viewer-bootstrap";
import { redirect } from "next/navigation";

export default async function WorkspaceShell({
  children,
  locale,
}: Readonly<{
  children: React.ReactNode;
  locale: string;
}>) {
  const bootstrap = await getViewerBootstrap();
  const currentLocale = isAppLocale(locale) ? locale : "en";

  if (!bootstrap.initialUserKey) {
    const nextPath = localizePathname("/dashboard", currentLocale);
    redirect(
      `${localizePathname("/auth/sign-in", currentLocale)}?next=${encodeURIComponent(nextPath)}&expired=1`
    );
  }

  return (
    <ViewerProvider
      initialMe={bootstrap.initialMe}
      initialUserKey={bootstrap.initialUserKey}
      initialSessionUser={bootstrap.initialSessionUser}
    >
      <AppSidebar>
        <div className="min-h-screen bg-background">{children}</div>
      </AppSidebar>
    </ViewerProvider>
  );
}
