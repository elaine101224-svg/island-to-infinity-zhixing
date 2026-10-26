import PublishedHome from '@/components/home/PublishedHome';
import { readPublishedContent } from '@/lib/websiteContent';
export const revalidate = 300;
export default async function Home() { return <PublishedHome content={await readPublishedContent()} />; }
