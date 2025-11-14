import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex flex-col justify-center p-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
