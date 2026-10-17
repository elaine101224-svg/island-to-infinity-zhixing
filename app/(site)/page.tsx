import PublishedHome from '@/components/home/PublishedHome';
import { readPublishedContent } from '@/lib/websiteContent';
export const dynamic = 'force-dynamic';
export default async function Home() { return <PublishedHome content={await readPublishedContent()} />; }
