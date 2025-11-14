"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthTokenProvider } from "@/contexts/AuthTokenContext";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Render the NextThemesProvider immediately. The inline no-flash script
  // in `app/layout.tsx` ensures the correct theme class is present before
  // hydration, so we don't need a client-only "mounted" guard here.
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark"]}
      {...props}
    >
      <AuthTokenProvider>
        {children}
      </AuthTokenProvider>
    </NextThemesProvider>
  );
}