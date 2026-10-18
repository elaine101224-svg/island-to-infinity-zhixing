import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';
import { readPublishedContent, contentPhotoUrls } from '@/lib/websiteContent';

export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-f0-9]{32}\.webp$/.test(file)) return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
  const admin = await validateSession();
  try {
    if (!admin && !contentPhotoUrls(await readPublishedContent(true)).has(`/api/uploads/${file}`)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { data, error } = await supabase.storage.from('photos').download(file);
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(await data.arrayBuffer(), { headers: { 'Content-Type': 'image/webp', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Photo unavailable' }, { status: 503 }); }
}
