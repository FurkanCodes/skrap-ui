"use client";

import { Radar } from "lucide-react";
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
    title: "Scraper Console",
    href: "/",
    icon: Radar,
  },
];

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-[11px] tracking-[0.14em] uppercase">
              Workspace
            </SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                    className="h-10 rounded-lg px-3"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background px-6 py-3">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <p className="text-sm font-medium text-muted-foreground">Skrap Workspace</p>
          <AuthControls />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppSidebar;
