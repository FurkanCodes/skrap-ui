import WorkspaceShell from "@/app/[locale]/(workspace)/workspace-shell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <WorkspaceShell locale={locale}>{children}</WorkspaceShell>;
}
