"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-blue-600 dark:bg-blue-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-900 dark:to-purple-900 opacity-90" />
        {/* Pattern overlay could go here */}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to transform your reading?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join BooksReader today and take your entire library with you, wherever you go.
            Free to start, no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/library"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Explore Library
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-blue-200 opacity-80">
            Open source and privacy focused.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
