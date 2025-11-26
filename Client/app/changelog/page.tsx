"use client";

import { motion } from "framer-motion";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ChangelogPage() {
  const releases = [
    {
      version: "v1.2.0",
      date: "October 25, 2025",
      title: "Dark Mode & Performance",
      description: "A major update focusing on visual comfort and speed.",
      changes: [
        "Added full dark mode support across all pages",
        "Improved PDF rendering speed by 40%",
        "New glassmorphism UI design",
        "Fixed mobile navigation issues",
      ],
      type: "Major",
    },
    {
      version: "v1.1.0",
      date: "October 10, 2025",
      title: "Collections & Organization",
      description: "Better ways to organize your growing library.",
      changes: [
        "Introduced custom collections",
        "Added bulk edit actions",
        "Smart sorting options (Date, Author, Title)",
        "Drag and drop upload support",
      ],
      type: "Feature",
    },
    {
      version: "v1.0.5",
      date: "September 28, 2025",
      title: "Bug Fixes & Polish",
      description: "Squashing bugs and improving stability.",
      changes: [
        "Fixed EPUB parsing errors for large files",
        "Resolved login session timeout issues",
        "Improved search accuracy",
        "Updated reading progress sync",
      ],
      type: "Patch",
    },
    {
      version: "v1.0.0",
      date: "September 1, 2025",
      title: "Initial Release",
      description: "BooksReader is live! The best way to read on the web.",
      changes: [
        "Support for PDF, EPUB, and TXT formats",
        "Clean, distraction-free reader",
        "Cross-device synchronization",
        "Basic analytics dashboard",
      ],
      type: "Major",
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Major": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "Feature": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Patch": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20 md:pt-24">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
            What&apos;s New
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Changelog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Stay up to date with the latest improvements and features.
          </p>
        </motion.div>

        <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 md:ml-6 space-y-12">
          {releases.map((release, index) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-12"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-gray-950" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getTypeColor(release.type)}`}>
                  {release.type}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {release.date}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    {release.title}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                      {release.version}
                    </span>
                  </h2>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {release.description}
                </p>

                <ul className="space-y-3">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Have a feature request? Let us know <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
