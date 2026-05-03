"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Logo from "@/assets/marketing/logo";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "motion/react";

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

type HeaderProps = {
  navigationData: NavigationSection[];
  isAuthenticated: boolean;
  className?: string;
};

const CtaButton = ({
  label,
  className,
  onClick,
}: {
  label: string;
  className?: string;
  onClick?: () => void;
}) => (
  <Button
    onClick={onClick}
    className={cn(
      "relative text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit overflow-hidden cursor-pointer",
      className,
      "cursor-pointer",
    )}
  >
    <span className="relative z-10 transition-all duration-500">{label}</span>
    <span className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
      <ArrowUpRight size={16} />
    </span>
  </Button>
);

const Header = ({ navigationData, isAuthenticated, className }: HeaderProps) => {
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  const ctaLabel = isAuthenticated ? "Go to Dashboard" : "Start free";
  const handleStart = useCallback(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    router.push("/auth/sign-up?next=/dashboard");
  }, [isAuthenticated, router]);

  return (
    <motion.header
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.7, ease: "easeInOut" }
      }
      className={cn(
        "inset-x-0 z-50 px-4 flex items-center justify-center sticky top-0 h-20",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-6xl flex items-center h-fit justify-between gap-3.5 lg:gap-6 transition-all duration-500",
          sticky
            ? "p-2.5 bg-background/60 backdrop-blur-lg border border-border/40 shadow-2xl shadow-primary/5 rounded-full"
            : "bg-transparent border-transparent",
        )}
      >
        <div>
          <a href="#home" className="flex items-center">
            <Logo className="gap-3" />
          </a>
        </div>

        <div>
          <NavigationMenu className="max-lg:hidden bg-muted p-0.5 rounded-full">
            <NavigationMenuList className="flex gap-0">
              {navigationData.map((navItem) => (
                <NavigationMenuItem key={navItem.title}>
                  <NavigationMenuLink
                    href={navItem.href}
                    className={cn(
                      "px-2 lg:px-4 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-background outline outline-transparent hover:outline-border hover:shadow-xs transition tracking-normal",
                      navItem.isActive ? "bg-background text-foreground" : "",
                    )}
                  >
                    {navItem.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex gap-4">
          <CtaButton label={ctaLabel} className="hidden lg:flex" onClick={handleStart} />

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="rounded-full border border-border p-2 block">
                  <Menu width={20} height={20} />
                  <span className="sr-only">Menu</span>
                </span>
              </SheetTrigger>

              <SheetContent
                showCloseButton={false}
                side="right"
                className="w-full sm:w-96 p-0 border-l-0"
              >
                <div className="flex items-center justify-between p-6">
                  <a href="#home" className="flex items-center">
                    <Logo className="gap-2" />
                  </a>
                  <SheetClose id="mobile-menu-close">
                    <span className="rounded-full border border-border p-2.5 block">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 px-6 pb-6 overflow-y-auto">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavigationMenu
                      orientation="vertical"
                      className="items-start flex-none"
                    >
                      <NavigationMenuList className="flex flex-col items-start gap-3">
                        {navigationData.map((item) => (
                          <NavigationMenuItem key={item.title}>
                            <NavigationMenuLink
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "group/nav flex items-center text-2xl font-semibold tracking-tight transition-all p-0 hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                                item.isActive
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:translate-x-2",
                              )}
                            >
                              <div
                                className={cn(
                                  "h-0.5 bg-primary transition-all duration-300 overflow-hidden",
                                  item.isActive
                                    ? "w-4 mr-2 opacity-100"
                                    : "w-0 opacity-0 group-hover/nav:w-4 group-hover/nav:mr-2 group-hover/nav:opacity-100",
                                )}
                              />
                              {item.title}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>

                    <div className="w-fit">
                      <CtaButton
                        label={ctaLabel}
                        onClick={() => {
                          setIsOpen(false);
                          handleStart();
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <div className="flex gap-3">
                      {[
                        { icon: "lucide:circle-dollar-sign", href: "#pricing", label: "Jump to pricing" },
                        { icon: "lucide:circle-help", href: "#faq", label: "Jump to FAQ" },
                        { icon: "lucide:mail", href: "mailto:hello@dealvinci.com", label: "Email Dealvinci" },
                      ].map((item) => (
                        <a
                          key={item.icon}
                          href={item.href}
                          aria-label={item.label}
                          className="flex items-center justify-center rounded-full outline outline-border hover:bg-muted transition p-3 shadow-xs"
                        >
                          <Icon icon={item.icon} width={16} height={16} />
                        </a>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">© 2026 Dealvinci</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
