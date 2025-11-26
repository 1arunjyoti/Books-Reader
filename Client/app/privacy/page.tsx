"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Lock, Eye, FileText, Server, UserCheck, Cookie } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    { id: "what-we-collect", title: "What we collect", icon: FileText },
    { id: "how-we-use", title: "How we use information", icon: Eye },
    { id: "sharing", title: "Sharing & third parties", icon: UserCheck },
    { id: "security", title: "Security", icon: Lock },
    { id: "retention", title: "Data retention", icon: Server },
    { id: "your-rights", title: "Your rights", icon: Shield },
    { id: "cookies", title: "Cookies", icon: Cookie },
    { id: "contact", title: "Contact", icon: null },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20 md:pt-24">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar Navigation (Sticky) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Contents
              </p>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  BooksReader respects your privacy. We believe your reading habits are personal. 
                  This policy explains what we collect, why we collect it, and how we protect your data.
                </p>
              </div>

              <div className="space-y-16">
                <section id="what-we-collect" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    What we collect
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>We collect information to provide core features and keep your account secure. This includes:</p>
                    <ul className="space-y-2 mt-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                        <span><strong>Account Data:</strong> Information provided by you or your identity provider during authentication.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                        <span><strong>User Content:</strong> Files you upload (ebooks, PDFs) and metadata you attach to them.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                        <span><strong>Preferences:</strong> Settings like theme, font size, and reading progress.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                        <span><strong>Technical Data:</strong> Browser type, device information, and IP address for security and diagnostics.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="how-we-use" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    How we use information
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>We use the information we collect strictly for:</p>
                    <ul className="grid sm:grid-cols-2 gap-4 mt-4 list-none pl-0">
                      <li className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        Providing and personalizing the BooksReader experience
                      </li>
                      <li className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        Processing uploads and storing user files securely
                      </li>
                      <li className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        Account security, fraud prevention, and abuse detection
                      </li>
                      <li className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        Improving the product and troubleshooting technical issues
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="sharing" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <UserCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Sharing & third parties
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="font-medium text-lg mb-4">We do not sell your personal data.</p>
                    <p>We may share data with:</p>
                    <ul className="space-y-2 mt-4">
                      <li>Service providers who help operate the site (hosting, email delivery, analytics).</li>
                      <li>When required by law, to comply with legal processes or enforce our terms.</li>
                    </ul>
                    <p className="mt-4 text-sm text-gray-500">
                      Third-party services (like analytics) may collect anonymized usage data. You can opt out of analytics in your <Link href="/profile" className="text-blue-600 hover:underline">profile settings</Link>.
                    </p>
                  </div>
                </section>

                <section id="security" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Security
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We take reasonable administrative and technical measures to protect your data. 
                    No system is perfect — if you discover a vulnerability, please contact us so we can respond quickly.
                  </p>
                </section>

                <section id="retention" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Data retention
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We retain files and account data only as long as needed to provide the service and as required by law. 
                    You can request deletion of your account and data via the contact link below.
                  </p>
                </section>

                <section id="your-rights" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Your rights
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. 
                    To exercise these rights, please <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.
                  </p>
                </section>

                <section id="cookies" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Cookie className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Cookies
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We use cookies and similar technologies for necessary site functionality and optional analytics. 
                    You can control cookie preferences in your browser or in-app settings where available.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-24 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Questions?</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    If you have questions about this policy, please visit our <Link href="/contact" className="text-blue-600 hover:underline">contact page</Link>.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
