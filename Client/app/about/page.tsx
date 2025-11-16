import Link from "next/link";

export const metadata = {
  title: "About - BooksReader",
  description: "About BooksReader - a cross platform app to read books",
};

export default function AboutPage() {
  return (
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-7xl" role="main">
        <header className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">About BooksReader</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            BooksReader is a lightweight platform, built to make reading digital books simple and enjoyable. We support PDFs, EPUBs and plain text formats and provide features like collections, highlights, bookmarks, and more.
          </p>

          <h2 id="mission-heading" className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Our mission</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            To make reading accessible and pleasant across devices while keeping user data private and secure.
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">Back to <Link href="/" className="text-blue-600 dark:text-blue-400">home</Link>.</p>
        </header>

      {/* Features */}
      <section aria-labelledby="features-heading" className="mt-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <h2 id="features-heading" className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Features</h2>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4">
          <li>Support for multiple book formats: <b>PDF, EPUB, TXT</b></li>
          <li>Search functionality to find books quickly</li>
          <li>Organize books into collections</li>
          <li>Sort books by reading status, title, author, or date added</li>
          <li>Advanced filtering options (e.g., by genre, publication date)</li>
          <li>Downloading books for offline reading</li>
          
          <li>Highlight and annotate text</li>
          <li>Bookmark pages for quick access</li>
          <li>Dark mode for comfortable reading at night</li>
          <li>Sync reading progress across devices</li>
          <li>Customizable reading settings (font size, background color, etc.)</li>
          <li>Text-to-speech functionality</li>
        </ul>
      </section>

      {/* Future Plans */}
      <section aria-labelledby="future-heading" className="mt-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <details className="w-full">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h2 id="future-heading" className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white">Future Plans</h2>
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>

          <ul className="mt-4 list-disc list-inside text-gray-700 dark:text-gray-300 mb-4">
            <li>Adding support for more file formats</li>
            <li>Improving the annotation and highlighting tools</li>
            <li>Offline reading mode</li>
            <li>Implementing advanced search features</li>
            <li>Importing books from cloud storage (e.g., Google Drive, Dropbox)</li>
            <li>Exporting annotations and highlights</li>
            <li>Enhancing the user interface for better accessibility</li>
            <li>Expanding the app to include social features (e.g., sharing highlights)</li>
            <li>Mobile app development</li>
          </ul>
        </details>

      </section>
      </main>
  );
}
