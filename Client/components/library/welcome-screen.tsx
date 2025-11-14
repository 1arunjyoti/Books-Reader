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
import { Badge } from '@/components/ui/badge';

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
    badge: "Start Here"
  },
  {
    icon: BookOpen,
    title: "Immersive Reading Experience",
    description: "Enjoy a distraction-free reading experience with customizable fonts, themes, and layouts for both PDF and EPUB formats.",
    color: "from-purple-500 to-pink-500",
    badge: "Core Feature"
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Highlights",
    description: "Save your favorite passages, add highlights with custom colors, and take notes directly in your books.",
    color: "from-amber-500 to-orange-500",
    badge: "Essential"
  },
  {
    icon: Search,
    title: "Smart Organization",
    description: "Use advanced filters, collections, and search to organize and find your books instantly.",
    color: "from-green-500 to-emerald-500",
    badge: "Organize"
  },
  {
    icon: BarChart3,
    title: "Reading Analytics",
    description: "Track your reading progress, statistics, and insights. See how much you have read and when.",
    color: "from-violet-500 to-purple-500",
    badge: "Track Progress"
  },
  {
    icon: Target,
    title: "Set Reading Goals",
    description: "Create daily, weekly, or monthly reading goals and stay motivated to reach your targets.",
    color: "from-rose-500 to-pink-500",
    badge: "Stay Motivated"
  },
  {
    icon: Folder,
    title: "Custom Collections",
    description: "Organize books into collections by genre, author, or any category you prefer.",
    color: "from-indigo-500 to-blue-500",
    badge: "Organize"
  },
  {
    icon: Palette,
    title: "Personalize Your Experience",
    description: "Choose between light and dark themes, customize reading modes, and adjust settings to your preference.",
    color: "from-teal-500 to-cyan-500",
    badge: "Customize"
  }
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto"
      >
        <Card className="border-border shadow-lg bg-card overflow-hidden relative">
          <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 relative">
            {/* Close Button - Moved inside CardContent to ensure proper z-index */}
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
            <div className="text-center mb-8 sm:mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2, damping: 15 }}
                className="inline-flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 rounded-xl bg-primary mb-4 sm:mb-6"
              >
                <Sparkles className="h-7 sm:h-8 w-7 sm:w-8 text-primary-foreground" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-foreground"
              >
                Hello, There!
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto"
              >
                Discover powerful features to transform your reading experience.
              </motion.p>
            </div>

            {/* Features Carousel */}
            <div className="mb-8 sm:mb-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 100, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.98 }}
                  transition={{ duration: 0.35, type: "spring", damping: 25 }}
                  className="w-full"
                >
                  {/* Single Feature Card */}
                  <div className="relative p-6 sm:p-8 md:p-10 rounded-2xl border border-border bg-muted/30 overflow-hidden">
                    {/* Badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", damping: 15 }}
                      className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3"
                    >
                      <Badge className="bg-primary text-primary-foreground px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold">
                        {currentFeature.badge}
                      </Badge>
                    </motion.div>

                    <div className="relative z-10">
                      {/* Icon & Content */}
                      <div className="flex items-start gap-4 sm:gap-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", damping: 12 }}
                          className={`flex-shrink-0 inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-lg bg-gradient-to-br ${currentFeature.color}`}
                        >
                          <Icon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
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
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                size="sm"
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-2 sm:gap-3">
                {currentStep < totalSlides - 1 && (
                  <Button
                    variant="ghost"
                    onClick={skipToEnd}
                    size="sm"
                    className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5"
                  >
                    Skip
                  </Button>
                )}
                
                {currentStep < totalSlides - 1 ? (
                  <Button 
                    onClick={nextStep}
                    size="sm"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={onClose} 
                    size="sm"
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium"
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
              transition={{ delay: 1 }}
              className="text-center mt-6 text-xs sm:text-sm text-muted-foreground"
            >
              Use arrow keys or buttons to navigate • Press ESC to close
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
