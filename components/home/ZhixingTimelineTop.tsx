'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const timeline = [
  {
    year: '2024',
    image: '/images/members/2024.jpg',
    title: 'Founding Year',
  },
  {
    year: '2025',
    image: '/images/members/2025.jpg',
    title: 'Growing Community',
  },
];

export default function ZhixingTimelineTop() {
  const [index, setIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % timeline.length);
  const prev = () => setIndex((prev) => (prev - 1 + timeline.length) % timeline.length);
  const item = timeline[index];

  const blurAmount = Math.min(scrollY / 50, 12);
  const scaleAmount = 1 + Math.min(scrollY / 1000, 0.05);

  return (
    <section className="w-full relative h-[40vh] sm:h-[50vh] overflow-hidden">
      <img
        src={item.image}
        alt={item.year}
        className="w-full h-full object-cover transition-all duration-500"
        style={{
          filter: `blur(${blurAmount}px)`,
          transform: `scale(${scaleAmount})`,
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end items-center text-white pb-12 sm:pb-16">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">{item.year}</h2>
        <p className="text-lg sm:text-xl text-white/80 font-medium">{item.title}</p>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {timeline.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === index ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 px-3 py-2 rounded-full text-white transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 px-3 py-2 rounded-full text-white transition-all"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
