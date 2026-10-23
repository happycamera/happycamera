"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "@/lib/motion";

interface HeroSlide {
  brand: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  objectClass?: string;
}

const slides: HeroSlide[] = [
  {
    brand: "Sony",
    headline: "Power meets precision",
    description:
      "Cutting-edge sensors, class-leading autofocus. Sony gear built for photographers who won't wait.",
    ctaLabel: "Shop Sony",
    ctaLink: "/shop?brand=sony",
    image: "/images/hero-section.webp",
    objectClass: "object-[85%_center] md:object-[62%_center]",
  },
  {
    brand: "Canon",
    headline: "Precision you can trust",
    description:
      "Legendary optics and dependable build. Canon gear designed to perform, frame after frame.",
    ctaLabel: "Shop Canon",
    ctaLink: "/shop?brand=canon",
    image: "/images/hero-canon.webp",
    objectClass: "object-[85%_center] md:object-[62%_center]",
  },
  {
    brand: "Fujifilm",
    headline: "Color in every frame",
    description:
      "Retro-inspired design, legendary film simulations. Fujifilm gear made for photographers who see differently.",
    ctaLabel: "Shop Fujifilm",
    ctaLink: "/shop?brand=fujifilm",
    image: "/images/hero-fuji.webp",
    objectClass: "object-[85%_center] md:object-center",
  },
  {
    brand: "Nikon",
    headline: "Built to capture light",
    description:
      "Robust, reliable, and razor-sharp. Nikon bodies made for photographers who push further.",
    ctaLabel: "Shop Nikon",
    ctaLink: "/shop?brand=nikon",
    image: "/images/hero-nikon.webp",
    objectClass: "object-[85%_center] md:object-center",
  },
];

const ROTATE_MS = 7000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setIndex((i + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (paused || reduced) return;
    timerRef.current = setInterval(next, ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, reduced, next]);

  const slide = slides[index];

  return (
    <section
     className="relative z-10 w-full h-[400px] md:h-auto md:aspect-[21/9] overflow-hidden group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0 w-full h-full"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={slide.image}
            alt={slide.headline}
            fill
            sizes="100vw"
            priority
            quality={75}
            className={`!w-full !h-full object-cover ${slide.objectClass || ""}`}
          />
        </motion.div>
      </AnimatePresence>

      {/* overlay */}
      <div className="absolute inset-0 bg-amber-800/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 md:from-black/60 md:via-black/25 to-transparent pointer-events-none" />

      {/* content */}
      <div className="relative z-10 h-full flex items-end md:items-center justify-center px-6 md:px-4 pb-11 md:pb-0 max-w-3xl mx-auto">
        <div className="text-center w-full">
          <motion.p
            key={`brand-${index}`}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-yellow-400 font-medium mb-2 md:mb-5"
          >
            {slide.brand}
          </motion.p>
          <motion.h2
            key={`headline-${index}`}
            initial={reduced ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="text-[28px] md:text-[clamp(2rem,6vw,5rem)] font-bold tracking-tight text-white leading-[1.1] font-serif"
          >
            {slide.headline}
          </motion.h2>
          <motion.p
            key={`desc-${index}`}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="mt-3 md:mt-5 text-sm md:text-lg text-white/70 max-w-lg mx-auto leading-relaxed line-clamp-2 md:line-clamp-none"
          >
            {slide.description}
          </motion.p>
          <motion.div
            key={`cta-${index}`}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
            className="mt-6 md:mt-10 flex items-center justify-center"
          >
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-wider uppercase bg-white text-black rounded-none hover:bg-gray-100 min-w-[220px] transition-all"
            >
              {slide.ctaLabel}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* arrows */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors border border-white/20"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors border border-white/20"
      >
        <ChevronRight size={22} />
      </button>

      {/* dots */}
      <div className="absolute bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={
              "h-2.5 rounded-full transition-all duration-300 " +
              (i === index
                ? "w-7 bg-yellow-400"
                : "w-2.5 bg-white/40 hover:bg-white/70")
            }
          />
        ))}
      </div>
    </section>
  );
}
