"use client";

import { LayoutDashboard, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/assets/logo/logo";
import AuthControls from "@/components/layout/auth-controls";
import ThemeToggle from "@/components/theme/theme-toggle";
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
      <Sidebar className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="px-4 py-4">
          <Link href="/" prefetch={false} className="inline-flex items-center">
            <Logo />
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="h-7 px-2 text-xs font-medium text-muted-foreground">
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
                      className="h-9 rounded-md px-3 text-sm"
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

        <div className="mt-auto border-t border-sidebar-border/80 px-4 py-3 text-xs text-muted-foreground">
          Telegram can be configured in Settings.
        </div>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-background px-6 py-3">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <p className="text-sm font-medium text-muted-foreground">PriceSniper Workspace</p>
          <ThemeToggle />
          <AuthControls />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppSidebar;
