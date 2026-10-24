import PhotoViewer from '@/components/ui/PhotoViewer';
import type { PublicCard } from '@/lib/contentSchema';
export default function PublicCards({ cards }: { cards: PublicCard[] }) {
  return cards.length ? <div className="grid sm:grid-cols-2 gap-6">{cards.map(c => <article key={c.id} className="editor-panel"><PhotoViewer photo={c.photo} />{c.planningStatus&&<p className="text-sm font-medium text-earth-mid">{c.schoolEvent?'Event: ':''}{c.planningStatus}{c.schoolEvent&&` · Our participation: ${c.participationStatus||'TBC'}`}</p>}{c.date && <time className="text-sm text-earth-mid block mt-3">{c.date}</time>}<h2 className="font-serif text-2xl my-3">{c.title}</h2><p className="leading-relaxed text-earth-mid whitespace-pre-line">{c.summary}</p></article>)}</div> : <p className="text-earth-mid">Reviewed public introductions will appear here soon.</p>;
}
