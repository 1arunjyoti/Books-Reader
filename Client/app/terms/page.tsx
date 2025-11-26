"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Shield, 
  User, 
  FileText, 
  AlertTriangle, 
  Copyright, 
  Scale, 
  Gavel, 
  HelpCircle,
  RefreshCw,
  Ban
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    { id: "acceptance", title: "Acceptance of terms", icon: FileText },
    { id: "accounts", title: "Accounts", icon: User },
    { id: "user-content", title: "User content", icon: FileText },
    { id: "prohibited", title: "Prohibited conduct", icon: Ban },
    { id: "ip", title: "Intellectual property", icon: Copyright },
    { id: "disclaimer", title: "Disclaimers", icon: AlertTriangle },
    { id: "liability", title: "Limitation of liability", icon: Scale },
    { id: "indemnity", title: "Indemnification", icon: Shield },
    { id: "termination", title: "Termination", icon: Ban },
    { id: "governing", title: "Governing law", icon: Gavel },
    { id: "changes", title: "Changes", icon: RefreshCw },
    { id: "contact", title: "Contact", icon: HelpCircle },
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
                  <FileText className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  These Terms of Service (Terms) govern your use of BooksReader. By accessing or using the service you agree to these Terms. If you do not agree, do not use the service.
                </p>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Last updated: October 31, 2025</p>
              </div>

              <div className="space-y-16">
                <section id="acceptance" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Acceptance of terms
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>
                      By using BooksReader you accept and agree to be bound by these Terms and our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.
                    </p>
                  </div>
                </section>

                <section id="accounts" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Accounts
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us promptly of any unauthorized use.
                  </p>
                </section>

                <section id="user-content" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    User content and uploads
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    You retain ownership of the files and content you upload. By uploading content, you represent that you have the right to do so. You grant BooksReader a limited license to store and serve your files as necessary to provide the service.
                  </p>
                </section>

                <section id="prohibited" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Ban className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Prohibited conduct
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>Do not use the service to upload, store, or share content that infringes intellectual property or violates law. Prohibited activities include:</p>
                    <ul className="space-y-2 mt-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0" />
                        <span>Uploading copyrighted material without permission</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0" />
                        <span>Attempting to access accounts belonging to others or their data</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0" />
                        <span>Using the service for unlawful purposes</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="ip" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Copyright className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Intellectual property
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    All rights, titles, and interest in the BooksReader platform (excluding user content) are owned by BooksReader or its licensors. You may not copy or redistribute proprietary components without permission.
                  </p>
                </section>

                <section id="disclaimer" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Disclaimers
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    The service is provided as is and we disclaim warranties to the fullest extent permitted by law. We do not guarantee availability, accuracy, or fitness for a particular purpose.
                  </p>
                </section>

                <section id="liability" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Scale className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Limitation of liability
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    To the extent permitted by law, BooksReader and its affiliates will not be liable for indirect, incidental, consequential, or punitive damages arising from your use of the service.
                  </p>
                </section>

                <section id="indemnity" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Indemnification
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    You agree to indemnify and hold harmless BooksReader from any claims, losses, liabilities, and expenses arising from your breach of these Terms or your use of the service.
                  </p>
                </section>

                <section id="termination" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Ban className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Termination
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We may suspend or terminate accounts that violate these Terms or for other legitimate reasons. Upon termination, access to your account and files may be removed.
                  </p>
                </section>

                <section id="governing" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Gavel className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Governing law
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    These Terms are governed by the laws applicable where BooksReader operates, unless otherwise required by law. For disputes, please contact us first so we can attempt to resolve the issue informally.
                  </p>
                </section>

                <section id="changes" className="scroll-mt-24">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Changes to these Terms
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We may update these Terms from time to time. When changes are material, we will provide notice via the service or email where possible.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-24 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Questions?</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    If you have questions about these Terms, please visit our <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link>.
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
