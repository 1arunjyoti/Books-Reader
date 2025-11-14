"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import { Button } from "./ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  // Enable a short CSS transition on the root element to make the theme
  // change feel smooth. We add the class briefly and remove it after the
  // duration. Respect users who prefer reduced motion.
  const enableThemeTransition = () => {
    if (typeof window === "undefined") return;
    try {
      document.documentElement.classList.add("theme-transition");
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 250);
    } catch {
      // ignore
    }
  };

  // Toggle theme between light and dark. If the current theme is 'system',
  // the toggle will set an explicit theme. We enable the transient transition
  // around the change to animate colors.
  const toggleTheme = useCallback(() => {
    enableThemeTransition();
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {/* Render both icons so server HTML doesn't depend on client theme.
          CSS (the `dark` class on <html>) will control which is visible. */}
      <span className="inline-block dark:hidden"><Moon /></span>
      <span className="hidden dark:inline-block"><Sun /></span>
    </Button>
  );
}
