"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ContactForm from "../../components/ContactForm";
import { Mail, Twitter, FileText, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
           <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Have questions, feedback, or just want to say hello? We&apos;d love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
            {/* Contact Info Column */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-5 space-y-8"
            >
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email Us</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">For general inquiries and support</p>
                      <a href="mailto:hello@booksreader.example" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        hello@booksreader.example
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Twitter className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Social Media</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Follow us for updates</p>
                      <a href="https://twitter.com/booksreader" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {/* @booksreader */}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Legal</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Review our policies</p>
                      <div className="flex gap-4">
                        <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Privacy</Link>
                        <Link href="/terms" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Terms</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-4">Community Support</h3>
                <p className="text-blue-100 mb-6">
                  Join our community forum to discuss features, report bugs, and connect with other readers.
                </p>
                <a href="#" className="inline-flex items-center gap-2 text-white font-medium hover:gap-3 transition-all">
                  Visit Community <ArrowRight className="w-4 h-4" />
                </a>
              </div> */}
            </motion.div>

            {/* Contact Form Column */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Send us a message</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </p>
                </div>
                
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
