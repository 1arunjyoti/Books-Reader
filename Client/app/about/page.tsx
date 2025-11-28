"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  Library, 
  ListFilter, 
  Download, 
  Highlighter, 
  Bookmark, 
  Moon, 
  RefreshCw, 
  Settings, 
  Mic,
  Sparkles,
  CircleMinus
} from "lucide-react";

export default function AboutPage() {
  const features = [
    { icon: BookOpen, text: "Support for PDF, EPUB, TXT" },
    { icon: Search, text: "Fast search functionality" },
    { icon: Library, text: "Organize into collections" },
    { icon: ListFilter, text: "Smart sorting & filtering" },
    { icon: Download, text: "Offline reading mode" },
    { icon: Highlighter, text: "Highlight & annotate" },
    { icon: Bookmark, text: "Smart bookmarking" },
    { icon: Moon, text: "Dark mode support" },
    { icon: RefreshCw, text: "Cross-device sync" },
    { icon: Settings, text: "Customizable settings" },
    { icon: Mic, text: "Text-to-speech" },
  ];

  const futurePlans = [
    "Support for more file formats",
    "Advanced annotation tools",
    "Enhanced offline capabilities",
    "Cloud storage integration (Drive, Dropbox)",
    "Export annotations & highlights",
    "Social sharing features",
    "Mobile app development",
    "Accessibility enhancements"
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
           <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">BooksReader</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              A lightweight, powerful platform built to make reading digital books simple, enjoyable, and accessible everywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              To make reading accessible and pleasant across devices while keeping user data private and secure. 
              We believe your library should belong to you, available anytime, anywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need for the perfect reading experience</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-200">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Plans */}
      <section className="py-20 bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Roadmap</h2>
            <p className="text-gray-400">What we&apos;re building next</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {futurePlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <CircleMinus className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{plan}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <Link 
          href="/sign-up"
          className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-lg hover:shadow-xl"
        >
          Start Reading Now
        </Link>
      </section>
    </main>
  );
}
