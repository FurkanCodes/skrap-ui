"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AnimatedDropdownOption {
  value: string;
  label: string;
  keywords?: string;
}

interface AnimatedDropdownProps {
  id?: string;
  options: ReadonlyArray<AnimatedDropdownOption>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AnimatedDropdown({
  id,
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  searchable = false,
  searchPlaceholder = "Search options...",
  disabled = false,
  className,
}: AnimatedDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [openUpward, setOpenUpward] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open && searchable) {
      inputRef.current?.focus();
    }
  }, [open, searchable]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const expectedHeight = searchable ? 300 : 220;
    setOpenUpward(spaceBelow < expectedHeight && spaceAbove > spaceBelow);
  }, [open, searchable]);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!searchable) {
      return options;
    }

    const query = searchQuery.trim().toLowerCase();
    const normalized = options.filter((option) => {
      if (!query) {
        return true;
      }

      const searchText = `${option.label} ${option.keywords ?? ""}`.toLowerCase();
      return searchText.includes(query);
    });

    return normalized;
  }, [options, searchQuery, searchable]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "absolute right-0 left-0 z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {searchable ? (
              <div className="border-b border-border p-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full rounded-lg border border-transparent bg-muted/50 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background"
                  />
                </div>
              </div>
            ) : null}

            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  return (
                    <motion.button
                      key={option.value}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.14, delay: index * 0.015 }}
                      type="button"
                      onClick={() => {
                        onValueChange(option.value);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected ? "bg-primary/10 text-foreground" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-medium", isSelected ? "text-foreground" : "text-foreground/85")}>
                          {option.label}
                        </p>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
