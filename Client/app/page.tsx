import { StartReadingButton } from "@/components/landing/start-reading-button";
import { BookOpen, Smartphone } from "lucide-react";
import Link from "next/link";

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
    <main className="min-h-screen">

      {/* Skip link for keyboard users */}
      <a href="#content" className="sr-only focus:not-sr-only z-50 p-2 m-2 rounded bg-white text-sm text-blue-700">
        Skip to main content
      </a>

      {/* Hero Section */}
      <section id="content" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="hero-heading">

        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BooksReader",
              url: "https://your-domain.com",
              description:
                "A modern reading experience. Sync highlights, bookmarks and reading progress across devices.",
            }),
          }}
        />
        
        <div className="text-center">
          <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Read Your Favorite Books,
            <br />
            <span className="text-blue-600 dark:text-blue-400">Anywhere, Anytime</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
            A modern reading experience that lets you take your library with you. Read across all your devices with seamless synchronization.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <StartReadingButton />
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50 dark:bg-gray-800" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 dark:text-white">Why Choose BooksReader?</h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">Everything you need for a perfect reading experience</p>
          </div>

          <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <li className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6" aria-hidden>
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personal Library</h3>
              <p className="text-gray-600 dark:text-gray-300">Access your library from anywhere, anytime.</p>
            </li>

            <li className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6" aria-hidden>
                <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Read Anywhere</h3>
              <p className="text-gray-600 dark:text-gray-300">Sync your reading progress across all devices, online or offline.</p>
            </li>
          </ul>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-800">
        <div className="max-w-4xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-white mb-6">Ready to start your reading journey?</h2>
          <p className="text-xl text-blue-100 mb-8">Start enjoying your favorite books with BooksReader.</p>
          <Link 
            href="/sign-up"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors"
            aria-label="Get Started for Free"
          >
            Get Started for Free
          </Link>

        </div>
      </section>

    </main>
  );
}
