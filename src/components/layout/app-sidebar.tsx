"use client";

import { type CSSProperties } from "react";
import {
  IconBell,
  IconCirclePlus,
  IconPointer,
  IconLayoutGrid,
  IconMessageCircle,
  IconSelector,
  IconSettings,
  IconWorld,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import Logo from "@/assets/marketing/logo";
import AuthControls from "@/components/layout/auth-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { cn } from "@/lib/utils";

const navItems = [
  {
    titleKey: "dashboard",
    href: "/dashboard",
    icon: IconLayoutGrid,
  },
  {
    titleKey: "extensions",
    href: "/extensions",
    icon: IconPointer,
  },
  {
    titleKey: "notifications",
    href: "/notifications",
    icon: IconMessageCircle,
  },
  {
    titleKey: "settings",
    href: "/settings",
    icon: IconSettings,
  },
];

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("layout.sidebar");
  const trackingHeaderT = useTranslations("tracking.dashboard.header");
  const trackingUnauthenticatedT = useTranslations("tracking.dashboard.unauthenticated");
  const extensionsT = useTranslations("extensions");
  const settingsT = useTranslations("settings");
  const notificationsT = useTranslations("notificationsPage");
  const pathname = usePathname();
  const { isAuthenticated } = useViewer();
  const pageHero =
    pathname === "/dashboard"
      ? {
          title: isAuthenticated
            ? trackingHeaderT("title")
            : trackingUnauthenticatedT("title"),
          description: isAuthenticated
            ? trackingHeaderT("description")
            : trackingUnauthenticatedT("description"),
        }
      : pathname === "/settings"
        ? {
            title: settingsT("title"),
            description: settingsT("subtitle"),
          }
        : pathname === "/notifications"
          ? {
              title: notificationsT("title"),
              description: notificationsT("subtitle"),
            }
        : pathname === "/extensions"
          ? {
              title: extensionsT("title"),
              description: extensionsT("subtitle"),
            }
        : null;

  return (
    <div className="visitors-shell min-h-svh bg-background text-foreground">
      <header className="fixed left-1/2 top-0 z-40 w-full max-w-5xl -translate-x-1/2">
        <div className="absolute inset-x-0 top-0 -bottom-4 bg-background/80 backdrop-blur-lg [mask:linear-gradient(to_top,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_50%)]" />
        <div className="relative flex w-full items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              prefetch={false}
              className="grid size-8 shrink-0 place-items-center text-foreground transition-opacity duration-150 hover:opacity-80"
              aria-label={t("goToDashboard")}
            >
              <SidebarLogoIcon />
            </Link>
            <ProjectMenu workspaceLabel={t("workspace")} />
          </div>

          <AuthControls />
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-20">
        {pageHero ? <PageHero title={pageHero.title} description={pageHero.description} /> : null}

        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10", pageHero ? "mt-20" : "")}>
          <aside className="w-full md:w-48">
            <nav
              className="flex w-full items-start gap-6 overflow-x-auto border-b border-[var(--bg-3)] md:sticky md:top-20 md:flex-col md:gap-2 md:border-b-0"
              aria-label={t("workspace")}
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.titleKey}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors md:border-b-0 md:py-0",
                      isActive
                        ? "border-primary text-[var(--fg-4)]"
                        : "cursor-pointer border-transparent text-[var(--fg-2)] hover:text-[var(--fg-3)]"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" stroke={1.5} />
                    {t(`nav.${item.titleKey}`)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 px-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

function PageHero({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <h1 className="text-2xl font-medium tracking-tight text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ProjectMenu({ workspaceLabel }: { workspaceLabel: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex h-8 items-center gap-2 rounded-full pl-1 pr-2.5 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30">
        <span className="grid size-6 place-items-center rounded-full bg-muted shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-colors group-hover:bg-background">
          <span className="grid size-4 place-items-center rounded-full bg-foreground text-[8px] font-semibold text-background">
            D
          </span>
        </span>
        <span className="max-w-36 truncate">{workspaceLabel}</span>
        <IconSelector className="size-3.5 text-muted-foreground" stroke={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-44 p-0">
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuLabel className="px-2 pb-1.5 pt-1 text-[12px] font-medium text-muted-foreground">
            Projects
          </DropdownMenuLabel>
          <DropdownMenuItem className="min-h-8 px-2">
            <span className="grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-semibold text-background">
              D
            </span>
            dealvinci
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem className="min-h-8 px-2">
            <IconCirclePlus className="size-4" stroke={1.5} />
            Create project
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-8 px-2">
            <IconWorld className="size-4" stroke={1.5} />
            All projects
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-8 px-2 md:hidden">
            <IconBell className="size-4" stroke={1.5} />
            Realtime alerts
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLogoIcon() {
  const logoStyle = {
    "--brand-logo-accent": "var(--foreground)",
    "--brand-logo-wordmark": "var(--foreground)",
    "--brand-logo-cutout": "var(--background)",
  } as CSSProperties;

  return <Logo iconOnly className="size-8" style={logoStyle} />;
}

export default AppSidebar;
