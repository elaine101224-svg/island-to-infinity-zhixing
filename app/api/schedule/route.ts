import { NextResponse } from 'next/server';
import { readPublishedContent } from '@/lib/websiteContent';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const content = await readPublishedContent();
    // Compatibility shape for the calendar, deliberately excluding internal IDs,
    // addresses, contacts, family assignments and private descriptions.
    return NextResponse.json(content.cards.filter(c => c.kind === 'event' && c.published && c.date).map(c => ({ id:c.id,title:c.title,type:c.eventType||'event',date:c.date,startTime:c.startTime||'',endTime:c.endTime||'',location:c.venue||'Venue to be confirmed',description:c.summary,isPublic:true })), { headers: { 'Cache-Control':'no-store' } });
  } catch { return NextResponse.json({error:'Schedule unavailable'}, {status:503}); }
}
