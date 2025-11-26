"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      slug: "future-of-digital-reading",
      title: "The Future of Digital Reading",
      excerpt: "How AI and spatial computing are transforming the way we consume books.",
      date: "Oct 28, 2025",
      readTime: "5 min read",
      author: "Sarah Chen",
      category: "Technology",
      image: "/blog/reading-future.jpg", // Placeholder path
      color: "from-blue-500 to-purple-500",
    },
    {
      slug: "organizing-your-library",
      title: "Mastering Your Digital Library",
      excerpt: "Tips and tricks for keeping your ebook collection organized and accessible.",
      date: "Oct 15, 2025",
      readTime: "8 min read",
      author: "Mike Ross",
      category: "Productivity",
      image: "/blog/library-org.jpg",
      color: "from-green-500 to-emerald-500",
    },
    {
      slug: "best-formats-explained",
      title: "EPUB vs PDF: Which Should You Choose?",
      excerpt: "A deep dive into file formats and when to use each for the best experience.",
      date: "Sep 30, 2025",
      readTime: "6 min read",
      author: "Alex Kim",
      category: "Guides",
      image: "/blog/formats.jpg",
      color: "from-orange-500 to-red-500",
    },
    {
      slug: "reading-stats-guide",
      title: "Understanding Your Reading Habits",
      excerpt: "How to use analytics to build better reading consistency.",
      date: "Sep 12, 2025",
      readTime: "4 min read",
      author: "Sarah Chen",
      category: "Lifestyle",
      image: "/blog/stats.jpg",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20 md:pt-24">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Blog</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Insights, updates, and guides from the BooksReader team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-12">
          {posts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image Placeholder with Gradient */}
              <div className={`h-64 w-full bg-gradient-to-br ${post.color} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md text-xs font-semibold text-gray-900 dark:text-white">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6 flex-1 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{post.author}</span>
                  </div>

                  <Link 
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all"
                  >
                    Read Article <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
