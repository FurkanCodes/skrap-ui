"use client";

import { LayoutDashboard, Radar, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/assets/logo/logo";
import AuthControls from "@/components/layout/auth-controls";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings2,
  },
];

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border bg-white/90 backdrop-blur">
        <SidebarHeader className="px-4 py-4">
          <Link href="/" prefetch={false} className="inline-flex items-center">
            <Logo />
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Menu
            </SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} prefetch={false} />}
                      className="h-10 rounded-xl px-3 text-sm"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <div className="mt-auto border-t border-sidebar-border/80 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-2.5 text-xs text-muted-foreground dark:bg-zinc-900/50">
            <span className="grid size-7 place-items-center rounded-lg bg-zinc-400 text-white">
              <Radar className="size-3.5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Telegram</p>
              <p className="text-[10px] text-muted-foreground">Configure in Settings</p>
            </div>
          </div>
        </div>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/70 bg-background/80 px-6 py-3 backdrop-blur">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <p className="text-sm font-medium text-muted-foreground">PriceSniper Workspace</p>
          <AuthControls />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppSidebar;
