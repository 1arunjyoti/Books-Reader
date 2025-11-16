import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - BooksReader",
  description: "How BooksReader collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-7xl" aria-labelledby="privacy-heading">
      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <h1 id="privacy-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          BooksReader respects your privacy. This page explains what information we collect, why we collect it, how we use it, and the choices you have. Short version: we only collect information necessary to provide and improve the service. We do not sell personal data.
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Last updated: <time dateTime="2025-10-31">October 31, 2025</time></p>

        <nav aria-label="Table of contents" className="mb-6">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#what-we-collect">What we collect</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#how-we-use">How we use information</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#sharing">Sharing &amp; third parties</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#security">Security</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#your-rights">Your rights</a></li>
            <li><a className="text-blue-600 dark:text-blue-400 hover:underline" href="#contact">Contact</a></li>
          </ul>
        </nav>

        <section id="what-we-collect" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">What we collect</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We collect information to provide core features and keep your account secure. This includes:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mb-4">
            <li>Account and authentication data (provided by you or your identity provider)</li>
            <li>Files you upload (ebooks, PDFs) and related metadata you choose to attach</li>
            <li>User preferences and settings (theme, reader position, highlights)</li>
            <li>Technical data (browser, device, IP address) for diagnostics and security</li>
          </ul>
        </section>

        <section id="how-we-use" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">How we use information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We use the information we collect for:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mb-4">
            <li>Providing and personalizing the BooksReader experience</li>
            <li>Processing uploads and storing user files (only as long as needed)</li>
            <li>Account security, fraud prevention, and abuse detection</li>
            <li>Improving the product and troubleshooting issues</li>
          </ul>
        </section>

        <section id="sharing" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Sharing &amp; third parties</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We do not sell your personal data. We may share data with:</p>
          <ul className="list-disc ml-6 text-gray-700 dark:text-gray-300 mb-4">
            <li>Service providers who help operate the site (hosting, email delivery, analytics)</li>
            <li>When required by law, to comply with legal processes or enforce our terms</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">Third-party services (like analytics) may collect anonymized usage data. You can opt out of analytics — see the <Link href="/profile" className="text-blue-600 dark:text-blue-400">profile settings</Link> or contact us below.</p>
        </section>

        <section id="security" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Security</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We take reasonable administrative and technical measures to protect your data. No system is perfect — if you discover a vulnerability, please contact us so we can respond quickly.</p>
        </section>

        <section id="retention" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Data retention</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We retain files and account data only as long as needed to provide the service and as required by law. You can request deletion of your account and data via the contact link below.</p>
        </section>

        <section id="your-rights" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Your rights</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. To exercise these rights, please <Link href="/contact" className="text-blue-600 dark:text-blue-400">contact us</Link>. We will respond in accordance with applicable law.</p>
        </section>

        <section id="cookies" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Cookies and similar technologies</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We use cookies and similar technologies for necessary site functionality and optional analytics. You can control cookie preferences in your browser or in-app settings where available.</p>
        </section>

        <section id="changes" className="mb-6">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">Changes to this policy</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">We may update this page occasionally. When changes are significant, we will provide more prominent notice.</p>
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
