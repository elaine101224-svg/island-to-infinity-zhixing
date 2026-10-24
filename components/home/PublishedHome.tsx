import Link from 'next/link';
import { HeartHandshake, BookOpen, Users, ArrowUpRight } from 'lucide-react';
import PhotoViewer from '@/components/ui/PhotoViewer';
import JourneyGallery from './JourneyGallery';
import { photoIsPublic, type HomepageContent } from '@/lib/contentSchema';

const directions = [
  { title: 'Companionship & Home Visits', icon: HeartHandshake, text: 'We return to the same families, make time for conversation, and share everyday activities chosen together.' },
  { title: 'Learning & Growth', icon: BookOpen, text: 'We learn alongside children through reading, creative activities, study support, and opportunities to try something new.' },
  { title: 'Community Connections', icon: Users, text: 'We bring families and students together through shared outings and community activities, in partnership with the Changshu Women’s Federation.' },
];
export default function PublishedHome({ content }: { content: HomepageContent }) {
  const updates = content.cards.filter(c => c.kind === 'update' && c.published && c.date && c.date <= new Date().toISOString().slice(0,10)).sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);
  const heroPhoto = content.photoPosition === 'hero' && photoIsPublic(content.teamPhoto);
  return <>
    <section id="journey" className="scroll-mt-24 bg-sand/30 border-t border-sand" aria-labelledby="journey-title"><div className="max-w-6xl mx-auto px-5 py-10 sm:py-14"><h2 id="journey-title" className="font-serif text-3xl sm:text-4xl mb-3">Our Journey</h2><p className="text-earth-mid mb-7">Founded in {content.foundingYear}. Each year’s team carries these connections forward.</p><JourneyGallery entries={content.history.filter(h => h.visible && photoIsPublic(h.photo))} /></div></section>
    <section className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
      <p className="text-sm font-medium tracking-widest uppercase text-terracotta-dark mb-4">UWC Changshu · Student-led community action</p>
      <div className="max-w-3xl mb-8"><h1 className="font-serif text-4xl sm:text-6xl font-semibold leading-tight mb-5">{content.title}</h1><p className="text-lg sm:text-xl leading-relaxed text-earth-mid">{content.intro}</p></div>
      <div className="flex flex-wrap gap-3 mb-8"><Link href="#our-work" className="editor-button bg-terracotta-dark">Explore Our Work</Link><Link href="#team" className="px-5 py-3 border border-earth-mid rounded-lg font-medium">Meet Our Team</Link></div>
      {heroPhoto && <PhotoViewer photo={content.teamPhoto} eager />}
    </section>
    <section id="about" className="bg-white border-y border-sand"><div className="max-w-6xl mx-auto px-5 py-9 grid md:grid-cols-[1fr_3fr] gap-5"><h2 className="font-serif text-3xl">About</h2><p className="text-lg leading-relaxed text-earth-mid max-w-3xl">{content.about}</p></div></section>
    {content.documentary?.url && content.documentary.consent && <section className="max-w-6xl mx-auto px-5 py-10 sm:py-14" aria-labelledby="documentary-title"><h2 id="documentary-title" className="font-serif text-3xl sm:text-4xl mb-6">{content.documentary.title}</h2><figure><video controls playsInline preload="none" poster="/images/documentary-2026-poster.jpg" aria-label={content.documentary.title} className="w-full aspect-video rounded-xl bg-black object-contain"><source src={content.documentary.url} type="video/mp4" /><a href={content.documentary.url}>Watch the documentary</a></video>{content.documentary.caption && <figcaption className="text-earth-mid mt-3 leading-relaxed">{content.documentary.caption}</figcaption>}</figure></section>}
    <section id="team" className="scroll-mt-24 max-w-6xl mx-auto px-5 py-10 sm:py-14">
      <p className="text-sm uppercase tracking-widest text-terracotta-dark mb-2">The people behind the visits</p><h2 className="font-serif text-3xl sm:text-4xl mb-6">Our Team · {content.schoolYear}</h2>
      {content.photoPosition === 'team' && photoIsPublic(content.teamPhoto) && <PhotoViewer photo={content.teamPhoto} />}
      {!photoIsPublic(content.teamPhoto) && content.members.length === 0 && <p className="text-earth-mid text-lg">Our team works in small groups to build consistent relationships with local families. Explore our team photographs in <Link href="#journey" className="underline underline-offset-4 text-terracotta-dark">Our Journey</Link>.</p>}
      <div className="grid sm:grid-cols-2 gap-6 mt-6">{content.groups.filter(g => g.visible && (g.description || g.photo.url || content.members.some(m => m.groupId === g.id))).map(g => <article key={g.id} className="bg-white border border-sand p-5 rounded-xl"><PhotoViewer photo={g.photo} /><h3 className="font-serif text-2xl mt-4 mb-2">{g.name}</h3><p className="text-earth-mid leading-relaxed">{g.description}</p><ul className="mt-4 flex flex-wrap gap-2">{content.members.filter(m => m.groupId === g.id).map(m => <li className="text-sm bg-cream border border-sand rounded-lg px-3 py-2" key={m.id}>{m.name}{m.role && <span className="block text-earth-mid">{m.role}</span>}</li>)}</ul></article>)}</div>
      {content.members.length > 0 && <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{content.members.map(m => <article key={m.id} className="flex flex-col items-center text-center rounded-xl border border-sand bg-white p-4">
        {m.photoUrl ? <PhotoViewer photo={{ url:m.photoUrl, alt: m.name, caption:'', consent:true }} /> : <div aria-hidden="true" className="w-14 h-14 rounded-full bg-sand flex items-center justify-center font-serif text-xl mb-3">{m.name.split(/\s+/).slice(0,2).map(p => p[0]).join('')}</div>}
        <h3 className="font-medium mt-2">{m.name}</h3>{m.role && <p className="text-sm text-earth-mid mt-1">{m.role}</p>}
      </article>)}</div>}
    </section>
    <section id="our-work" className="bg-white border-y border-sand"><div className="max-w-6xl mx-auto px-5 py-10 sm:py-14"><h2 className="font-serif text-3xl sm:text-4xl mb-8">What We Do</h2><div className="grid md:grid-cols-3 gap-7">{directions.map(d => <article key={d.title}><d.icon className="text-terracotta-dark w-7 h-7 mb-4" /><h3 className="text-xl font-semibold mb-3">{d.title}</h3><p className="text-earth-mid leading-relaxed">{d.text}</p></article>)}</div><Link href="/plans" className="inline-flex items-center gap-2 mt-8 text-terracotta-dark font-medium underline underline-offset-4">Our plans and approach <ArrowUpRight size={16} /></Link></div></section>
    <section id="updates" className="max-w-6xl mx-auto px-5 py-10 sm:py-14"><h2 className="font-serif text-3xl sm:text-4xl mb-7">Latest Updates</h2>{updates.length ? <div className="grid md:grid-cols-3 gap-6">{updates.map(u => <article key={u.id} className="bg-white rounded-xl border border-sand p-5"><PhotoViewer photo={u.photo} /><time className="block text-sm text-earth-mid mt-4">{u.date}</time><h3 className="font-serif text-xl mt-2 mb-3">{u.title}</h3><p className="text-earth-mid leading-relaxed whitespace-pre-line">{u.summary}</p></article>)}</div> : <p className="text-earth-mid">Public updates from our visits and shared activities will appear here once reviewed.</p>}</section>

  </>;
}
