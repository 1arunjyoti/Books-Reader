import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import QueryProvider from '@/components/QueryProvider';
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Books Reader",
  description: "A cross platform app to read books",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" } // fallback
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        
        <head>
          {/* Prevent flash of incorrect theme by setting class before hydration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function () {
                try {
                  var key = 'theme';
                  var theme = localStorage.getItem(key);
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // silent
                }
              })();`,
            }}
          />
          {/* Preconnect to Google Fonts to speed up font fetch */}
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>

        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900`}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Navbar />
              <main className="min-h-[calc(100vh-8rem)]">
                <SpeedInsights />
                {children}
                <Analytics />
              </main>
              <Footer />
            </ThemeProvider>
          </QueryProvider>
        </body>
        
      </html>
    </ClerkProvider>
  );
}
