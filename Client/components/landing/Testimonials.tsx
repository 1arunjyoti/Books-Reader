"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Avid Reader",
    content: "Finally, a reader that actually syncs properly between my iPad and phone. The interface is gorgeous too!",
    avatar: "SC"
  },
  {
    name: "Marcus Johnson",
    role: "Student",
    content: "The highlighting and note-taking features are a game changer for my research. Highly recommended.",
    avatar: "MJ"
  },
  {
    name: "Elena Rodriguez",
    role: "Book Club Host",
    content: "I love how easy it is to organize my collection. The dark mode is perfect for late night reading sessions.",
    avatar: "ER"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Readers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Join thousands of users who have upgraded their reading experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
