'use client';

import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  /** Delay in ms before the element animates in — useful for staggering siblings. */
  delay?: number;
  className?: string;
}

/**
 * Fades and rises its children into view the first time they enter the viewport.
 * Falls back to fully visible when IntersectionObserver is unavailable or the
 * user prefers reduced motion (handled in globals.css).
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Reveal-on-scroll: derive initial visibility from feature detection so we
  // don't have to call setState synchronously inside the effect for the
  // SSR/no-IntersectionObserver fallback.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
