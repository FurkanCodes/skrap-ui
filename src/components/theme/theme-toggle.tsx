"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="icon-sm" disabled aria-hidden="true">
        <span className="size-3.5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextThemeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="relative overflow-hidden"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      <span className="relative grid size-3.5 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.78, rotate: -18 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid place-items-center"
            >
              <Sun className="size-3.5" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.78, rotate: 18 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid place-items-center"
            >
              <Moon className="size-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Button>
  );
}
