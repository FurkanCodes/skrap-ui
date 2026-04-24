import WorkspaceShell from "@/app/(workspace)/workspace-shell";

export const dynamic = "force-dynamic";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
