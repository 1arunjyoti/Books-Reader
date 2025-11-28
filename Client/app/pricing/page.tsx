"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for casual readers.",
      features: [
        "Support for PDF & EPUB",
        "Basic reading stats",
        "50MB storage limit",
        "Standard support",
        "Mobile access",
      ],
      cta: "Get Started",
      href: "/sign-up",
      popular: false,
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "/month",
      description: "For the avid bookworm.",
      features: [
        "Everything in Free",
        "Unlimited storage",
        "Advanced analytics & goals",
        "Cloud sync across devices",
        "Priority support",
        "Custom themes & fonts",
        "Text-to-speech",
      ],
      cta: "Start Free Trial",
      href: "/sign-up?plan=pro",
      popular: true,
    },
    {
      name: "Team",
      price: "$19.99",
      period: "/month",
      description: "Collaborate and share libraries.",
      features: [
        "Everything in Pro",
        "Shared team library",
        "Admin controls",
        "Collaborative annotations",
        "API access",
        "Dedicated account manager",
      ],
      cta: "Contact Sales",
      href: "/contact",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "Can I switch plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time from your account settings.",
    },
    {
      question: "Is there a free trial?",
      answer: "We offer a 14-day free trial for the Pro plan. No credit card required to start.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and Apple Pay.",
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes! Students with a valid .edu email get 50% off the Pro plan.",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
           <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
           <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">pricing</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Choose the plan that fits your reading habits. No hidden fees. Cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-24">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 border ${
                  tier.popular
                    ? "border-blue-500 dark:border-blue-500 shadow-xl shadow-blue-500/10 bg-white dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                    {tier.period && <span className="text-gray-500 dark:text-gray-400">{tier.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  asChild 
                  className={`w-full ${
                    tier.popular 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  }`}
                  variant={tier.popular ? "default" : "outline"}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 dark:text-gray-400">Everything you need to know about our billing and plans.</p>
            </motion.div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 ml-8">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">Still have questions?</p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Contact our support team <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
