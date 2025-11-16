"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Bookmark, 
  BarChart3, 
  Palette, 
  Target, 
  Folder, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeScreenProps {
  onClose: () => void;
  userName?: string;
}

const features = [
  {
    icon: Upload,
    title: "Upload Your Books",
    description: "Drag and drop or click to upload PDF, EPUB, and TXT files. Your library is just a click away!",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    title: "Immersive Reading Experience",
    description: "Enjoy a distraction-free reading experience with customizable fonts, themes, and layouts for both PDF, EPUB and TXT formats.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Highlights",
    description: "Save your favorite passages, add highlights with custom colors, and take notes directly in your books.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Search,
    title: "Smart Organization",
    description: "Use advanced filters, collections, and search to organize and find your books instantly.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Reading Analytics",
    description: "Track your reading progress, statistics, and insights. See how much you have read and when.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Target,
    title: "Set Reading Goals",
    description: "Create daily, weekly, or monthly reading goals and stay motivated to reach your targets.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Folder,
    title: "Custom Collections",
    description: "Organize books into collections by genre, author, or any category you prefer.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Palette,
    title: "Personalize Your Experience",
    description: "Choose between light and dark themes, customize reading modes, and adjust settings to your preference.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Exciting New Features",
    description: "Stay tuned for upcoming features that will enhance your reading experience even further.",
    color: "from-pink-500 to-rose-500",
  },
];

export default function WelcomeScreen({ onClose }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSlides = features.length;

  const nextStep = () => {
    if (currentStep < totalSlides - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipToEnd = () => {
    setCurrentStep(totalSlides - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevStep();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentFeature = features[currentStep];
  const Icon = currentFeature.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 18, stiffness: 450 }}
        className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto"
      >
        <Card className="border border-gray-300 dark:border-gray-700 shadow-lg bg-card overflow-hidden relative">
          <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 hover:bg-destructive/10 rounded-full h-8 sm:h-10 w-8 sm:w-10"
              onClick={(e) => {
                e.stopPropagation();
                logger.log('[Welcome Screen] Close button clicked');
                onClose();
              }}
              aria-label="Close welcome screen"
            >
              <X className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
            
            {/* Header */}
            <div className="text-center mb-8 sm:mb-6">
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.18 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-foreground"
              >
                Hello, There!
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.18 }}
                className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto"
              >
                Discover powerful features to transform your reading experience.
              </motion.p>
            </div>

            {/* Features Carousel */}
            <div className="mb-8 sm:mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 100, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.98 }}
                  transition={{ duration: 0.18, type: "keyframes", damping: 20, stiffness: 400 }}
                  className="w-full"
                >
                  {/* Single Feature Card */}
                  <div className="relative p-6 sm:p-8 md:p-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-muted/30 overflow-hidden">

                    <div className="relative z-10">
                      {/* Icon & Content */}
                      <div className="flex items-start gap-4 sm:gap-6">
                        <motion.div
                          className={`flex-shrink-0 inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-lg bg-gradient-to-br ${currentFeature.color}`}
                        >
                          <Icon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                        </motion.div>

                        <motion.div
                          className="flex-grow"
                        >
                          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                            {currentFeature.title}
                          </h2>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {currentFeature.description}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`transition-all rounded-full ${
                    index === currentStep
                      ? 'w-8 h-2 bg-primary'
                      : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <Button
                onClick={prevStep}
                disabled={currentStep === 0}
                size="default"
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium"
                aria-label="button to go to previous feature"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 sm:gap-3">
                {currentStep < totalSlides - 1 && (
                  <Button
                    variant="outline"
                    onClick={skipToEnd}
                    size="default"
                    className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5"
                    aria-label="button to skip to last feature"
                  >
                    Skip
                  </Button>
                )}
                
                {currentStep < totalSlides - 1 ? (
                  <Button 
                    onClick={nextStep}
                    size="default"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium"
                    aria-label="button to go to next feature"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={onClose} 
                    size="default"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium"
                    aria-label="button to get started"
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>

            {/* Footer Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.14 }}
              className="text-center mt-4 text-xs sm:text-sm text-muted-foreground"
            >
              Use arrow keys or buttons to navigate • Press ESC to close
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
