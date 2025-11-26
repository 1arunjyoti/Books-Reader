"use client";

import { motion } from "framer-motion";
import { BookOpen, Cloud, Moon, Smartphone, WifiOff, Zap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Universal Library",
    description: "Import your EPUBs, PDFs, and more. Your entire collection, organized in one beautiful place.",
    color: "blue"
  },
  {
    icon: Cloud,
    title: "Seamless Sync",
    description: "Start reading on your phone, continue on your tablet. Your progress, highlights, and notes sync instantly.",
    color: "purple"
  },
  {
    icon: WifiOff,
    title: "Offline First",
    description: "No internet? No problem. Download your books and read anywhere, from flights to remote cabins.",
    color: "green"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with the latest web technologies for instant page loads and buttery smooth transitions.",
    color: "yellow"
  },
  {
    icon: Moon,
    title: "Eye Comfort",
    description: "Customizable themes, fonts, and spacing. Dark mode support that's actually easy on the eyes.",
    color: "indigo"
  },
  {
    icon: Smartphone,
    title: "Cross Platform",
    description: "Works on any device with a browser. Install as a PWA for a native app-like experience.",
    color: "pink"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Everything you need to <br />
            <span className="text-blue-600 dark:text-blue-400">read better.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            We&apos;ve crafted every detail to provide the most comfortable and powerful reading experience on the web.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
