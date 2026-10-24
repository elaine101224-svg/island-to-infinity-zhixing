'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PhotoViewer from '@/components/ui/PhotoViewer';
import type { HomepageContent } from '@/lib/contentSchema';

export default function JourneyGallery({ entries }: { entries: HomepageContent['history'] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    });
    element.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { element.removeEventListener('scroll', measure); observer.disconnect(); };
  }, [entries]);

  function advance(direction: number) {
    const element = track.current;
    if (!element) return;
    const first = element.firstElementChild as HTMLElement | null;
    const step = first ? first.getBoundingClientRect().width + 24 : element.clientWidth;
    element.scrollBy({ left: direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  if (!entries.length) return <p className="text-earth-mid">Team photographs will appear here once reviewed.</p>;

  return <>
    <div className="flex items-center justify-between gap-4 mb-4">
      <p id="journey-help" className="text-sm text-earth-mid">Swipe or scroll to explore the years.</p>
      <div className="flex gap-2 shrink-0">
        <button type="button" aria-label="Previous journey photo" aria-controls="journey-photos" disabled={edges.start} onClick={() => advance(-1)} className="flex size-11 items-center justify-center rounded-full border border-earth-mid text-earth-dark hover:bg-sand disabled:opacity-30 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-dark"><ArrowLeft size={20} aria-hidden="true" /></button>
        <button type="button" aria-label="Next journey photo" aria-controls="journey-photos" disabled={edges.end} onClick={() => advance(1)} className="flex size-11 items-center justify-center rounded-full border border-earth-mid text-earth-dark hover:bg-sand disabled:opacity-30 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-dark"><ArrowRight size={20} aria-hidden="true" /></button>
      </div>
    </div>
    <div ref={track} id="journey-photos" role="region" aria-label="Team photographs through the years" aria-describedby="journey-help" tabIndex={0} className="grid grid-flow-col auto-cols-[88%] sm:auto-cols-[72%] lg:auto-cols-[48%] gap-6 overflow-x-auto overscroll-x-contain snap-x snap-proximity pb-5 pt-1 px-1 -mx-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-dark [scrollbar-color:var(--color-earth-mid)_var(--color-sand)]" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); advance(event.key === 'ArrowRight' ? 1 : -1); }
    }}>
      {entries.map(entry => <article key={entry.id} className="min-w-0 snap-start">
        <PhotoViewer photo={entry.photo} />
        <h3 className="font-serif text-2xl mt-4 break-words">{entry.year} · {entry.title}</h3>
      </article>)}
    </div>
  </>;
}
