"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconChevronDown } from "@tabler/icons-react";

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
  const [menuMaxHeight, setMenuMaxHeight] = React.useState(256);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateMenuLayout = React.useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;
    const minMenuHeight = searchable ? 190 : 150;
    const maxMenuHeight = searchable ? 360 : 320;

    const spaceBelow = Math.max(
      0,
      window.innerHeight - triggerRect.bottom - gap - viewportPadding
    );
    const spaceAbove = Math.max(0, triggerRect.top - gap - viewportPadding);

    const shouldOpenUpward = spaceBelow < minMenuHeight && spaceAbove > spaceBelow;
    const preferredSpace = shouldOpenUpward ? spaceAbove : spaceBelow;
    const fallbackSpace = Math.max(spaceAbove, spaceBelow);
    const resolvedSpace = preferredSpace >= 96 ? preferredSpace : fallbackSpace;

    setOpenUpward(shouldOpenUpward);
    setMenuMaxHeight(Math.max(96, Math.min(maxMenuHeight, Math.floor(resolvedSpace))));
  }, [searchable]);

  const listMaxHeight = React.useMemo(() => {
    const searchHeaderOffset = searchable ? 56 : 0;
    return Math.max(96, menuMaxHeight - searchHeaderOffset);
  }, [menuMaxHeight, searchable]);

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

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    updateMenuLayout();
  }, [open, updateMenuLayout]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleViewportChange = () => {
      updateMenuLayout();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, updateMenuLayout]);

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
          "flex h-9 w-full items-center justify-between gap-2 rounded-full border border-border/70 bg-background px-3 text-[13px] font-medium text-foreground shadow-[0_1px_1px_rgb(24_25_37_/_0.04)] transition-all outline-none",
          "hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <IconChevronDown
          className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
          stroke={1.5}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ maxHeight: menuMaxHeight }}
            className={cn(
              "absolute right-0 left-0 z-50 flex flex-col overflow-hidden rounded-xl border border-border/70 bg-popover p-1 shadow-[0_14px_34px_-24px_rgb(24_25_37_/_0.42),0_0_0_1px_rgb(24_25_37_/_0.03)]",
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            )}
          >
            {searchable ? (
              <div className="border-b border-border/70 p-2">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full rounded-[10px] border border-transparent bg-muted px-3 text-sm font-medium text-foreground transition-all outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring/25"
                  />
                </div>
              </div>
            ) : null}

            <div className="min-h-0 overflow-y-auto" style={{ maxHeight: listMaxHeight }}>
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
                        "flex min-h-8 w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                        isSelected ? "text-foreground" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {option.label}
                        </p>
                      </div>
                      {isSelected ? <span className="size-1.5 rounded-full bg-radiant-violet" /> : null}
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
