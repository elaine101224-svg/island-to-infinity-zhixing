import { readPublishedContent } from '@/lib/websiteContent';
import PublicCards from '@/components/ui/PublicCards';

export const dynamic = 'force-dynamic';
export default async function Page() {
 const content = await readPublishedContent();
 return <div className="max-w-5xl mx-auto px-5 py-10"><h1 className="font-serif text-4xl mb-4">Families We Support</h1><p className="text-lg text-earth-mid mb-8">Respectful introductions, shared with permission. Private family information and visit notes stay within the team.</p><PublicCards cards={content.cards.filter(c => c.kind === 'family' && c.published)} /></div>;
}
