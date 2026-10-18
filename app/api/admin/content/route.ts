import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateSession } from '@/lib/auth';
import { guardMutation } from '@/lib/apiGuard';
import { homepageSchema, publicDocument, photoIsPublic, publicMembers } from '@/lib/contentSchema';
import { CONTENT_ID, CONTENT_CACHE_TAG, readContentState } from '@/lib/websiteContent';
import { supabase } from '@/lib/supabase';
import { getTeamMembers, getActivityRecords } from '@/lib/data';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await validateSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await readContentState(), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch { return NextResponse.json({ error: 'Unable to load website content' }, { status: 503 }); }
}
const schema = z.object({ action: z.enum(['save', 'publish', 'unpublish']), revision: z.number().int().nonnegative(), content: homepageSchema });
export async function PUT(request: NextRequest) {
  const guard = await guardMutation(request, schema);
  if (!guard.ok) return guard.response;
  const { action, revision, content } = guard.data;
  try {
    const patch: Record<string, unknown> = { draft: { ...content, members: [] }, revision: revision + 1, updated_at: new Date().toISOString() };
    if (action === 'publish') {
      const [members, activities] = await Promise.all([getTeamMembers(), getActivityRecords()]);
      const invalid = content.cards.find(c => c.published && c.kind === 'update' && (!c.date || !c.sourceId || !activities.some(a => a.id === c.sourceId && a.date === c.date && a.date <= new Date().toISOString().slice(0,10))));
      if (invalid) return NextResponse.json({ error: 'Published updates must link to an existing completed activity and have a date.' }, { status: 400 });
      if (content.cards.some(c => c.published && !c.summary.trim())) return NextResponse.json({ error: 'Each public entry needs a reviewed public summary.' }, { status: 400 });
      if (content.groups.some(g => g.visible && !g.name.trim())) return NextResponse.json({ error: 'Each visible group needs a public name.' }, { status: 400 });
      const photos = [content.teamPhoto, ...content.groups.filter(g => g.visible).map(g => g.photo), ...content.history.filter(h => h.visible).map(h => h.photo), ...content.cards.filter(c => c.published).map(c => c.photo)];
      if (photos.some(p => p.url && !photoIsPublic(p))) return NextResponse.json({ error: 'Every published photo needs consent and meaningful alt text.' }, { status: 400 });
      const doc = publicDocument(content);
      doc.members = publicMembers(members, content.schoolYear);
      // Save an immutable historical snapshot before updating the live pointer.
      const { error: historyError } = await supabase.from('website_content_versions').insert({ content_id: CONTENT_ID, document: doc });
      if (historyError) throw historyError;
      patch.published = doc;
    }
    if (action === 'unpublish') patch.published = null;
    const { data, error } = await supabase.from('website_content').update(patch).eq('id', CONTENT_ID).eq('revision', revision).select('revision').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Another editor saved changes. Reload before saving again.' }, { status: 409 });
    if (action !== 'save') revalidateTag(CONTENT_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ revision: data.revision, published: action === 'publish', message: action === 'save' ? 'Draft saved' : action === 'publish' ? 'Website published' : 'Website unpublished' });
  } catch { return NextResponse.json({ error: 'Save failed. Your changes have not been confirmed; please retry.' }, { status: 503 }); }
}
