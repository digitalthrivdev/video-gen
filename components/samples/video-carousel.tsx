"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VideoCarouselProps {
  videos: string[];
  autoPlayInterval?: number; // optional prop for timing
}

export function VideoCarousel({ videos, autoPlayInterval = 8000 }: VideoCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = videos.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  // autoplay effect
  // useEffect(() => {
  //   if (count <= 1) return;

  //   intervalRef.current = setInterval(() => {
  //     setIndex((i) => (i + 1) % count);
  //   }, autoPlayInterval);

  //   return () => {
  //     if (intervalRef.current) clearInterval(intervalRef.current);
  //   };
  // }, [count, autoPlayInterval]);

  if (!count) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative aspect-[16/9] sm:aspect-[16/9] w-full overflow-hidden rounded-xl border bg-black">
        <video
          key={videos[index]}
          className="h-full w-full object-contain"
          controls
          preload="metadata"
          muted
        >
          <source src={videos[index]} type="video/mp4" />
        </video>

        {/* Navigation buttons */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 border rounded-full p-2"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800 border rounded-full p-2"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots navigation */}
      <div className="flex justify-center gap-2 mt-3">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              i === index ? "bg-blue-600 scale-110" : "bg-gray-400 hover:bg-gray-500"
            }`}
            aria-label={`Go to video ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
