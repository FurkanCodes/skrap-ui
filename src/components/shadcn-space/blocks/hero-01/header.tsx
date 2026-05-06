"use client";

import type { CSSProperties } from "react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

import Logo from "@/assets/marketing/logo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

const darkLogoVars = {
  "--brand-logo-accent": "#7cc8ff",
  "--brand-logo-wordmark": "#ffffff",
  "--brand-logo-cutout": "#181925",
} as CSSProperties;

const lightLogoVars = {
  "--brand-logo-accent": "#2c78fc",
  "--brand-logo-wordmark": "#181925",
  "--brand-logo-cutout": "#ffffff",
} as CSSProperties;

const navLinkClass =
  "rounded-full px-2.5 py-2 text-sm font-medium leading-none text-canvas-white/68 transition-colors hover:text-canvas-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue/50";

const MobileLink = ({
  href,
  title,
  onClick,
}: {
  href: string;
  title: string;
  onClick: () => void;
}) => (
  <a
    href={href}
    onClick={onClick}
    className="flex items-center justify-between rounded-2xl bg-[#00000008] px-4 py-4 text-heading-sm font-semibold leading-heading-sm text-slate-ink transition-colors hover:bg-whisper-purple/45"
  >
    {title}
    <span className="h-2 w-2 rounded-full bg-radiant-violet" aria-hidden="true" />
  </a>
);

const Header = ({ navigationData, isAuthenticated, className }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleRegister = useCallback(() => {
    router.push("/auth/sign-up?next=/dashboard");
  }, [router]);

  const handleLogin = useCallback(() => {
    router.push("/auth/sign-in?next=/dashboard");
  }, [router]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
        }
        className={cn(
          "dark fixed top-8 left-1/2 -translate-x-1/2 z-99 w-[460px] bg-background backdrop-blur-lg rounded-[24px] overflow-hidden shadow-xs corner-superellipse/1.125 hidden md:block font-openrunde",
          className,
        )}
      >
      <nav
        aria-label="Main navigation"
        className="flex h-13 items-center gap-2 px-4 pr-3"
      >
        <a
          href="#home"
          className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/70"
          aria-label="Dealvinci home"
        >
          <Logo iconOnly className="text-canvas-white" style={darkLogoVars} />
        </a>

        <div className="flex flex-1 items-center gap-0.5">
          {navigationData.map((navItem) => (
            <a key={navItem.title} href={navItem.href} className={navLinkClass}>
              {navItem.title}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleDashboard}
              className="rounded-full bg-deep-purple px-4 py-2.5 text-[15px] font-medium leading-none text-canvas-white shadow-subtle transition-colors hover:bg-radiant-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radiant-violet/70"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleLogin}
                className="rounded-full px-2.5 py-2 text-sm font-medium leading-none text-canvas-white/74 transition-colors hover:text-canvas-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue/50"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleRegister}
                className="h-8 rounded-full bg-electric-blue px-3.5 text-sm font-medium leading-none text-canvas-white shadow-subtle transition-all hover:bg-radiant-violet active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue/50"
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>
      </motion.header>

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
        }
        className={cn(
          "fixed left-4 right-4 top-4 z-50 font-openrunde md:hidden",
          className,
        )}
      >
      <div className="flex h-13 w-full items-center justify-between rounded-[24px] border border-light-gray bg-canvas-white/95 px-3 shadow-subtle backdrop-blur-xl">
        <a href="#home" className="flex items-center" aria-label="Dealvinci home">
          <Logo iconOnly style={lightLogoVars} />
        </a>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger id="mobile-menu-trigger">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00000008] text-slate-ink">
              <IconMenu2 width={20} height={20} stroke={1.5} />
              <span className="sr-only">Menu</span>
            </span>
          </SheetTrigger>

          <SheetContent
            showCloseButton={false}
            side="right"
            className="w-full border-l-0 bg-canvas-white p-0 font-openrunde sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-light-gray px-5 py-4">
              <a href="#home" className="flex items-center" onClick={() => setIsOpen(false)}>
                <Logo style={lightLogoVars} />
              </a>
              <SheetClose id="mobile-menu-close">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00000008] text-slate-ink">
                    <IconX width={18} height={18} stroke={1.5} />
                  <span className="sr-only">Close menu</span>
                </span>
              </SheetClose>
            </div>

            <div className="flex min-h-[calc(100dvh-73px)] flex-col gap-8 px-5 py-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>

              <div className="flex flex-col gap-3">
                {navigationData.map((item) => (
                  <MobileLink
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-3">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      handleDashboard();
                    }}
                    className="h-12 rounded-full bg-radiant-violet px-5 text-body font-semibold leading-body text-canvas-white shadow-subtle"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleRegister();
                      }}
                      className="h-12 rounded-full bg-radiant-violet px-5 text-body font-semibold leading-body text-canvas-white shadow-subtle"
                    >
                      Register
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogin();
                      }}
                      className="h-12 rounded-full bg-[#00000008] px-5 text-body font-semibold leading-body text-slate-ink"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      </motion.header>
    </>
  );
};

export default Header;
