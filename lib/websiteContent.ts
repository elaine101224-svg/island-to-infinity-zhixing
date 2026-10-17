import { supabase } from '@/lib/supabase';
import { defaultHomepage, homepageSchema, type HomepageContent } from '@/lib/contentSchema';

export const CONTENT_ID = process.env.WEBSITE_CONTENT_ID || 'homepage';

export async function readContentState() {
  const { data, error } = await supabase.from('website_content').select('*').eq('id', CONTENT_ID).single();
  if (error || !data) throw new Error('Website content is unavailable. Please retry.');
  return { ...data, draft: Object.keys(data.draft || {}).length ? homepageSchema.parse(data.draft) : defaultHomepage } as { id: string; draft: HomepageContent; published: HomepageContent | null; revision: number; updated_at: string };
}

export async function readPublishedContent(): Promise<HomepageContent> {
  const state = await readContentState();
  return state.published ? homepageSchema.parse(state.published) : { ...defaultHomepage, members: [] };
}

export function contentPhotoUrls(content: HomepageContent): Set<string> {
  return new Set([content.teamPhoto.url, ...content.groups.map(g => g.photo.url), ...content.history.map(h => h.photo.url), ...content.cards.map(c => c.photo.url), ...content.members.map(m => m.photoUrl)].filter(Boolean));
}
