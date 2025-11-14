import Link from "next/link";
import ContactForm from "../../components/ContactForm";

export const metadata = {
  title: "Contact - BooksReader",
  description: "Contact BooksReader team",
};

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-7xl" aria-labelledby="contact-heading">
      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <h1 id="contact-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Contact</h1>

        <p className="text-gray-700 dark:text-gray-300 mb-4">Questions, feedback, or found a bug? Use the form or reach out using one of the channels below. We typically respond within a few business days.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Other ways to reach us</h2>
            <ul className="text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>
                Email: <a href="mailto:hello@booksreader.example" className="text-blue-600 dark:text-blue-400">hello@booksreader.example</a>
              </li>
              <li>
                Twitter: <a href="https://twitter.com/booksreader" className="text-blue-600 dark:text-blue-400">@booksreader</a>
              </li>
              <li>
                Privacy & Terms: <Link href="/privacy" className="text-blue-600 dark:text-blue-400">Privacy</Link> · <Link href="/terms" className="text-blue-600 dark:text-blue-400">Terms</Link>
              </li>
            </ul>

            <p className="text-sm text-gray-600 dark:text-gray-400">For legal requests, please email <a className="text-blue-600 dark:text-blue-400" href="mailto:legal@booksreader.example">legal@booksreader.example</a>.</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Send us a message</h2>
            <ContactForm />
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 md:mt-0">Back to <Link href="/" className="text-blue-600 dark:text-blue-400">home</Link>.</p>
      </div>
    </main>
  );
}
