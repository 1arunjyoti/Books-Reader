import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";

/* Metadata for SEO */
export const metadata = {
  title: "BooksReader — Read anywhere, sync across devices",
  description:
    "A modern reading experience. Sync highlights, bookmarks and reading progress across devices. Read offline and carry your library with you.",
  openGraph: {
    title: "BooksReader — Read anywhere",
    description:
      "Take your library with you. Read offline and sync across devices.",
    url: "https://booksreader.vercel.app/",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://booksreader.vercel.app/",
  },
};

export default async function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Skip link for keyboard users */}
      <a href="#content" className="sr-only focus:not-sr-only z-50 p-2 m-2 rounded bg-white text-sm text-blue-700">
        Skip to main content
      </a>

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "BooksReader",
            url: "https://booksreader.vercel.app",
            description:
              "A modern reading experience. Sync highlights, bookmarks and reading progress across devices.",
          }),
        }}
      />

      <div id="content">
        <Hero />
        <Features />
        <CTA />
      </div>
    </main>
  );
}
