"use client";

import { useState, type CSSProperties } from "react";
import { LayoutDashboard, Settings2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import Logo from "@/assets/marketing/logo";
import AuthControls from "@/components/layout/auth-controls";
import LanguageSwitcher from "@/components/layout/language-switcher";
import ThemeToggle from "@/components/theme/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  {
    titleKey: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "settings",
    href: "/settings",
    icon: Settings2,
  },
];

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("layout.sidebar");
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const sidebarOpen = isPinnedOpen || isHoverExpanded;
  const [hoveredItemState, setHoveredItemState] = useState<{
    path: string;
    title: string | null;
  }>({
    path: "",
    title: null,
  });
  const activeItemTitle =
    navItems.find((item) => pathname === item.href)?.titleKey ?? null;
  const hoveredItemTitle =
    hoveredItemState.path === pathname ? hoveredItemState.title : null;
  const highlightedItemTitle = hoveredItemTitle ?? activeItemTitle;
  const sidebarVariables = {
    "--sidebar-width-icon": "3.75rem",
  } as CSSProperties;

  const handleOpenChange = (nextOpen: boolean) => {
    setIsPinnedOpen(nextOpen);
    setIsHoverExpanded(false);
  };

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={handleOpenChange}
      style={sidebarVariables}
    >
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-sidebar-border/70"
        onMouseEnter={() => {
          if (!isMobile && !isPinnedOpen) {
            setIsHoverExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile && !isPinnedOpen) {
            setIsHoverExpanded(false);
          }
        }}
      >
        <SidebarHeader className="px-2.5 py-3">
          <Link
            href="/dashboard"
            prefetch={false}
            className="flex h-10 w-full items-center justify-start overflow-hidden rounded-xl px-[11px] transition-colors hover:bg-sidebar-accent/60"
            aria-label={t("goToDashboard")}
          >
            {sidebarOpen ? <SidebarLogo /> : <SidebarLogoIcon />}
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup className="px-1 pt-1">
            <SidebarMenu
              className="gap-1.5"
              onMouseLeave={() =>
                setHoveredItemState({
                  path: pathname,
                  title: null,
                })
              }
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem
                    key={item.titleKey}
                    onMouseEnter={() =>
                      setHoveredItemState({
                        path: pathname,
                        title: item.titleKey,
                      })
                    }
                  >
                    {highlightedItemTitle === item.titleKey ? (
                      <motion.span
                        layoutId={shouldReduceMotion ? undefined : "sidebar-nav-highlight"}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 34, mass: 0.6 }
                        }
                        className="pointer-events-none absolute inset-0 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/90 shadow-[0_6px_18px_-12px_hsl(var(--sidebar-foreground)/0.8)]"
                      />
                    ) : null}
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} prefetch={false} />}
                      className={cn(
                        "relative z-10 h-10 w-full justify-start overflow-hidden rounded-lg px-3 text-[13px] font-medium transition-colors duration-200 ease-out",
                        "hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent",
                        "text-sidebar-foreground/85 hover:text-sidebar-foreground data-[active=true]:text-sidebar-foreground",
                        "group-data-[collapsible=icon]:size-auto! group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:px-[11px]! group-data-[collapsible=icon]:py-0!"
                      )}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        <item.icon className="size-4" />
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none absolute top-1/2 left-10 -translate-y-1/2 whitespace-nowrap transition-opacity duration-200 ease-out",
                          sidebarOpen ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {t(`nav.${item.titleKey}`)}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

      
      </Sidebar>

      <SidebarInset className="overflow-hidden border border-border/70 bg-background md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="-ml-1 h-8 w-8 shrink-0" />
              <div className="h-5 w-px bg-border" aria-hidden="true" />
              <p className="truncate text-sm font-medium text-muted-foreground">{t("workspace")}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <AuthControls />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

function SidebarLogo() {
  const logoStyle = {
    "--brand-logo-accent": "var(--sidebar-foreground)",
    "--brand-logo-wordmark": "var(--sidebar-foreground)",
    "--brand-logo-cutout": "var(--sidebar)",
  } as CSSProperties;

  return (
    <motion.div
      className="relative z-20 flex items-center py-1 text-sm font-normal text-sidebar-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Logo className="gap-2.5" style={logoStyle} />
    </motion.div>
  );
}

function SidebarLogoIcon() {
  const logoStyle = {
    "--brand-logo-accent": "var(--sidebar-foreground)",
    "--brand-logo-wordmark": "var(--sidebar-foreground)",
    "--brand-logo-cutout": "var(--sidebar)",
  } as CSSProperties;

  return (
    <div className="relative z-20 flex items-center py-1 text-sm font-normal text-sidebar-foreground">
      <Logo iconOnly style={logoStyle} />
    </div>
  );
}

export default AppSidebar;
