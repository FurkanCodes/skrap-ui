"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeName = "light" | "dark" | "system";
type ThemeAttribute = "class" | `data-${string}`;

const DEFAULT_STORAGE_KEY = "theme";
const DEFAULT_THEMES: ThemeName[] = ["light", "dark"];
const SYSTEM_MEDIA_QUERY = "(prefers-color-scheme: dark)";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: ThemeAttribute | ThemeAttribute[];
  defaultTheme?: ThemeName;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: ThemeName;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(SYSTEM_MEDIA_QUERY).matches ? "dark" : "light";
}

function readStoredTheme(storageKey: string): ThemeName | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
  } catch {
    // Ignore storage errors in private browsing / restricted modes.
  }

  return null;
}

function writeStoredTheme(storageKey: string, theme: ThemeName): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Ignore storage errors in private browsing / restricted modes.
  }
}

function withTransitionsDisabled(nonce?: string): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const style = document.createElement("style");
  if (nonce) {
    style.setAttribute("nonce", nonce);
  }

  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
    )
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => {
      document.head.removeChild(style);
    }, 1);
  };
}

function applyThemeToDocument({
  attribute,
  enableColorScheme,
  resolvedTheme,
}: {
  attribute: ThemeAttribute | ThemeAttribute[];
  enableColorScheme: boolean;
  resolvedTheme: "light" | "dark";
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;
  const attributes = Array.isArray(attribute) ? attribute : [attribute];

  for (const targetAttribute of attributes) {
    if (targetAttribute === "class") {
      root.classList.remove(...DEFAULT_THEMES);
      root.classList.add(resolvedTheme);
      continue;
    }

    root.setAttribute(targetAttribute, resolvedTheme);
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme;
  }
}

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "system",
  enableSystem = true,
  enableColorScheme = true,
  disableTransitionOnChange = false,
  forcedTheme,
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (forcedTheme) {
      return forcedTheme;
    }

    return readStoredTheme(storageKey) ?? defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => getSystemTheme());

  useEffect(() => {
    if (!enableSystem || typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(SYSTEM_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [enableSystem]);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    const activeTheme = forcedTheme ?? theme;
    if (activeTheme === "system") {
      return enableSystem ? systemTheme : "light";
    }
    return activeTheme;
  }, [enableSystem, forcedTheme, systemTheme, theme]);

  useEffect(() => {
    const restoreTransitions = disableTransitionOnChange ? withTransitionsDisabled() : null;
    applyThemeToDocument({
      attribute,
      enableColorScheme,
      resolvedTheme,
    });
    restoreTransitions?.();
  }, [attribute, disableTransitionOnChange, enableColorScheme, resolvedTheme]);

  const setTheme = useCallback(
    (nextTheme: ThemeName) => {
      if (forcedTheme) {
        return;
      }

      setThemeState(nextTheme);
      writeStoredTheme(storageKey, nextTheme);
    },
    [forcedTheme, storageKey]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: forcedTheme ?? theme,
      resolvedTheme,
      setTheme,
    }),
    [forcedTheme, resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
