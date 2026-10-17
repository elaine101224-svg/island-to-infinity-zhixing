import { readPublishedContent } from '@/lib/websiteContent';
import PublicCards from '@/components/ui/PublicCards';
import SemesterOutline from '@/components/plans/SemesterOutline';
export const dynamic = 'force-dynamic';
export default async function Page() {
 const content = await readPublishedContent();
 return <div className="max-w-5xl mx-auto px-5 py-10"><h1 className="font-serif text-4xl mb-4">Our Plans</h1><p className="text-lg text-earth-mid mb-8">How we plan sustained companionship, learning activities and community connections.</p><PublicCards cards={content.cards.filter(c => c.kind === 'plan' && c.published)} /><SemesterOutline /></div>;
}
