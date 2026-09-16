import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HiringAnimation,
  InterviewAnimation,
  TalentSearchAnimation,
} from "./JobAnimations";

interface CarouselSlide {
  id: number;
  title: string;
  caption: string;
  visual: React.ReactNode;
  bgClass?: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    title: "WE'RE HIRING",
    caption: "Connect with top talent and build your dream team",
    visual: <HiringAnimation size={220} />,
  },
  {
    id: 2,
    title: "INTERVIEWS MADE EASY",
    caption: "Schedule, chat and hire with confidence",
    visual: <InterviewAnimation size={220} />,
  },
  {
    id: 3,
    title: "FIND TOP TALENT",
    caption: "Discover qualified candidates in minutes",
    visual: <TalentSearchAnimation size={220} />,
  },
];

const AUTO_ADVANCE_MS = 4200;

const AnimatedCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Advance logic using setTimeout so manual interactions restart the timer
  useEffect(() => {
    if (prefersReducedMotion) return; // do not auto-advance if user prefers reduced motion
    if (isPaused) return;

    // Clear any existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setTimeout(() => {
      setCurrentSlide((s) => (s + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentSlide, isPaused, prefersReducedMotion]);

  // Pause on focus/hover/touch interactions
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // restart timer by briefly toggling pause (optional)
    setIsPaused(false);
  };
  const nextSlide = () => setCurrentSlide((s) => (s + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((s) => (s - 1 + slides.length) % slides.length);

  return (
    <div
      className="relative h-full flex flex-col items-center justify-center py-12"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="relative w-full max-w-2xl h-[420px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            aria-hidden="true"
          >
            <div className="mb-6">{slides[currentSlide].visual}</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-foreground">
              {slides[currentSlide].title}
            </h2>
            <p className="text-lg text-muted-foreground text-center max-w-lg px-6">
              {slides[currentSlide].caption}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            prevSlide();
            // restart timer after manual navigation
            setIsPaused(false);
          }}
          className="pointer-events-auto bg-white/80 hover:bg-white shadow-md"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            nextSlide();
            setIsPaused(false);
          }}
          className="pointer-events-auto bg-white/80 hover:bg-white shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Dots */}
      <div
        className="flex gap-2 mt-8"
        role="tablist"
        aria-label="Carousel slides"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all ${
              index === currentSlide
                ? "w-10 h-3 bg-primary"
                : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            aria-selected={index === currentSlide}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedCarousel;
