declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    /**
     * The key used to store theme setting in localStorage
     * @default 'theme'
     */
    storageKey?: string;
    /**
     * The default theme
     * @default 'system'
     */
    defaultTheme?: string;
    /**
     * The attribute to use for applying the theme
     * @default 'class'
     */
    attribute?: string | 'class';
    /**
     * Whether to enable system theme detection
     * @default true
     */
    enableSystem?: boolean;
    /**
     * Whether to disable transitions when switching themes
     * @default false
     */
    disableTransitionOnChange?: boolean;
    /**
     * List of themes to cycle through
     * @default ['light', 'dark']
     */
    themes?: string[];
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
  };
}
