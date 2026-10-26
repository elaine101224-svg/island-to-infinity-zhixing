import { notFound } from 'next/navigation';
import { readPublishedContent } from '@/lib/websiteContent';
import PublicCards from '@/components/ui/PublicCards';
export const revalidate = 300;
export async function generateStaticParams(){const cards=(await readPublishedContent()).cards.filter(card=>card.kind==='family'&&card.published);return [...new Set(cards.flatMap(card=>[card.id,card.sourceId].filter(Boolean)))].map(id=>({id}));}
export default async function Page({params}: {params: Promise<{id:string}>}) {
 const {id} = await params;
 const card = (await readPublishedContent()).cards.find(c => c.kind === 'family' && c.published && (c.id === id || c.sourceId === id));
 if (!card) notFound();
 return <div className="max-w-4xl mx-auto px-5 py-10"><PublicCards cards={[card]} /></div>;
}
