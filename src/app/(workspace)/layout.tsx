import { Suspense } from "react";
import WorkspaceShell from "@/app/(workspace)/workspace-shell";
import WorkspaceShellFallback from "@/app/(workspace)/workspace-shell-fallback";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}
