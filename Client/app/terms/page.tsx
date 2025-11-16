import Link from "next/link";

export const metadata = {
  title: "Terms of Service - BooksReader",
  description: "Terms and conditions governing use of BooksReader.",
};

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-7xl" aria-labelledby="terms-heading">
      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <h1 id="terms-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          These Terms of Service (Terms) govern your use of BooksReader. By accessing or using the service you agree to these Terms. If you do not agree, do not use the service.
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Last updated: <time dateTime="2025-10-31">October 31, 2025</time></p>

        <nav aria-label="Terms table of contents" className="mb-6">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#acceptance">Acceptance</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#accounts">Accounts</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#user-content">User content</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#prohibited">Prohibited conduct</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#ip">Intellectual property</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#disclaimer">Disclaimers</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#liability">Limitation of liability</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#governing">Governing law</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#changes">Changes</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#contact">Contact</a></li>
          </ul>
        </nav>

        <section id="acceptance" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Acceptance of terms</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">By using BooksReader you accept and agree to be bound by these Terms and our <Link href="/privacy" className="text-blue-600 dark:text-blue-400">Privacy Policy</Link>.</p>
        </section>

        <section id="accounts" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Accounts</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us promptly of any unauthorized use.</p>
        </section>

        <section id="user-content" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">User content and uploads</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">You retain ownership of the files and content you upload. By uploading content, you represent that you have the right to do so. You grant BooksReader a limited license to store and serve your files as necessary to provide the service.</p>
        </section>

        <section id="prohibited" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Prohibited conduct</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">Do not use the service to upload, store, or share content that infringes intellectual property or violates law. Prohibited activities include:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mb-4">
            <li>Uploading copyrighted material without permission</li>
            <li>Attempting to access accounts belonging to others or their data</li>
            <li>Using the service for unlawful purposes</li>
          </ul>
        </section>

        <section id="ip" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Intellectual property</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">All rights, titles, and interest in the BooksReader platform (excluding user content) are owned by BooksReader or its licensors. You may not copy or redistribute proprietary components without permission.</p>
        </section>

        <section id="disclaimer" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Disclaimers</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">The service is provided as is and we disclaim warranties to the fullest extent permitted by law. We do not guarantee availability, accuracy, or fitness for a particular purpose.</p>
        </section>

        <section id="liability" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Limitation of liability</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">To the extent permitted by law, BooksReader and its affiliates will not be liable for indirect, incidental, consequential, or punitive damages arising from your use of the service.</p>
        </section>

        <section id="indemnity" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Indemnification</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">You agree to indemnify and hold harmless BooksReader from any claims, losses, liabilities, and expenses arising from your breach of these Terms or your use of the service.</p>
        </section>

        <section id="termination" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Termination</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We may suspend or terminate accounts that violate these Terms or for other legitimate reasons. Upon termination, access to your account and files may be removed.</p>
        </section>

        <section id="governing" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Governing law</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">These Terms are governed by the laws applicable where BooksReader operates, unless otherwise required by law. For disputes, please contact us first so we can attempt to resolve the issue informally.</p>
        </section>

        <section id="changes" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Changes to these Terms</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We may update these Terms from time to time. When changes are material, we will provide notice via the service or email where possible.</p>
        </section>

        <section id="contact" className="mb-4">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Contact</h2>
          <p className="text-gray-700 dark:text-gray-300">If you have questions about these Terms, please visit our 
            <Link href="/contact" className="text-blue-600 dark:text-blue-400"> contact page</Link> 
          </p>
        </section>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">Back to <Link href="/" className="text-blue-600 dark:text-blue-400">home</Link>.</p>
      </div>
    </main>
  );
}
