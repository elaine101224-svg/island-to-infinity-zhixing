'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const stats: Stat[] = [
  { value: 4, label: 'Families' },
  { value: 15, suffix: '+', label: 'Visits' },
  { value: 3, label: 'Focus Areas' },
  { value: 12, suffix: '+', label: 'Volunteers' },
];

/**
 * SSR-safe `prefers-reduced-motion` probe. Subscribes to changes so toggling
 * the OS preference updates the UI live.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Animate `0 -> target` over `duration` ms while `active` is true.
 *
 * If the section is active and the user prefers reduced motion, we still call
 * all hooks first (rules-of-hooks), then return the target value. This keeps
 * the component visually correct while obeying accessibility settings and
 * never setting state inside the effect body for the reduced-motion path.
 */
function useCountUp(target: number, active: boolean, duration = 1400): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || reducedMotion) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo for a lively settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const next = Math.round(eased * target);
      setValue((current) => (current === next ? current : next));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration, reducedMotion]);

  if (active && reducedMotion) return target;
  return value;
}

function StatItem({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(stat.value, active);
  return (
    <div>
      <div className="display-number text-4xl sm:text-5xl font-semibold mb-1">
        {count}
        {stat.suffix}
      </div>
      <div className="text-amber-light/60 text-xs tracking-widest uppercase">
        {stat.label}
      </div>
    </div>
  );
}

export default function ImpactStats() {
  const ref = useRef<HTMLDivElement>(null);
  // SSR/no-IO fallback renders the final value immediately.
  const [active, setActive] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-10 sm:py-12 bg-gradient-to-r from-earth-dark to-earth-mid text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
