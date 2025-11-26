"use client";

import { motion } from "framer-motion";
import { StartReadingButton } from "./start-reading-button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 pt-20 md:pt-24">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>The Future of Reading is Here</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-8"
          >
            Your Library, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Reimagined.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Experience a seamless reading journey across all your devices. 
            Sync progress, highlights, and bookmarks instantly. 
            Beautiful, fast, and built for readers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <StartReadingButton />
            <Link 
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer"
            >
              View Features
            </Link>
          </motion.div>

          {/* Floating UI Elements (Mockup) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative w-full max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 aspect-[16/9]">
              {/* Realistic Mock Reader Interface */}
              <div className="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col">
                {/* Mock Header */}
                <div className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/20" />
                    <div className="w-3 h-3 rounded-full bg-green-400/20" />
                  </div>
                  <div className="flex gap-4">
                     <div className="w-20 h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="flex gap-3">
                     <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800" />
                     <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Mock Sidebar */}
                  <div className="w-48 border-r border-gray-100 dark:border-gray-800 hidden md:flex flex-col p-4 gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                     <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="flex items-center gap-3 opacity-60">
                         <div className="w-6 h-8 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                         <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                       </div>
                     ))}
                  </div>

                  {/* Mock Content */}
                  <div className="flex-1 p-8 md:p-12 relative">
                    <div className="max-w-xl mx-auto space-y-6">
                      {/* Title */}
                      <div className="h-8 w-3/4 bg-gray-900/10 dark:bg-white/10 rounded-lg mb-8" />
                      
                      {/* Paragraphs */}
                      <div className="space-y-3">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-[98%] bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-[95%] bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-[92%] bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="h-3 w-[96%] bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-[94%] bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />
                  </div>
                </div>
              </div>
              
              {/* Glassmorphism Overlay Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 -bottom-4 sm:right-8 sm:bottom-8 p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 shadow-xl max-w-xs"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Progress Synced</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-[75%] bg-green-500 rounded-full" />
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
