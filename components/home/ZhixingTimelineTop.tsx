'use client';

import { useState, useEffect } from 'react';

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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % timeline.length);
  const prev = () => setIndex((prev) => (prev - 1 + timeline.length) % timeline.length);
  const item = timeline[index];

  // calculate blur and scale based on scroll
  const blurAmount = Math.min(scrollY / 50, 12); // max 12px
  const scaleAmount = 1 + Math.min(scrollY / 1000, 0.05); // max scale 1.05

  return (
    <section className="w-full relative h-[60vh] sm:h-[70vh] overflow-hidden">
      <img
        src={item.image}
        alt={item.year}
        className="w-full h-full object-cover transition-all duration-300"
        style={{
          filter: `blur(${blurAmount}px)`,
          transform: `scale(${scaleAmount})`,
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-end items-center text-white pb-10">
        <h2 className="text-4xl font-bold">{item.year}</h2>
        <p className="text-lg opacity-90">{item.title}</p>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur px-3 py-2 rounded-full text-white hover:bg-white/30 transition-colors"
      >
        ←
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur px-3 py-2 rounded-full text-white hover:bg-white/30 transition-colors"
      >
        →
      </button>
    </section>
  );
}