import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberError, memberService, sameOrigin, privateHeaders, dbResult } from '@/lib/members/auth';
import { requireRosterEditor } from '@/lib/members/roster';
export const dynamic = 'force-dynamic';
const schoolYear = z.string().regex(/^20\d{2}–\d{2}$/);
const editSchema = z.object({ id: z.string().min(1).max(100), expectedUpdatedAt: z.string().max(100), name: z.string().trim().min(1).max(100), status: z.enum(['active','inactive']), academicYears: z.array(schoolYear).min(1).max(20) }).strict();
function failure(error: unknown) { return NextResponse.json({ error: error instanceof MemberError ? error.message : 'The roster could not be saved. Please retry.' }, { status: error instanceof MemberError ? error.status : 503, headers: privateHeaders }); }
export async function GET() {
 try {
  await requireRosterEditor();
  const rows = dbResult(await memberService().from('team_members').select('id,data'));
  return NextResponse.json({ members: (rows ?? []).map(({id,data}) => ({ id, name: data.name, status: data.status, academicYears: data.academicYears ?? [], updatedAt: data.updatedAt ?? '' })) }, { headers: privateHeaders });
 } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
 try {
  sameOrigin(request); const { account } = await requireRosterEditor();
  if (Number(request.headers.get('content-length') ?? 0) > 10000) throw new MemberError('Request too large.', 413);
  let raw: unknown; try { raw = await request.json(); } catch { throw new MemberError('Invalid JSON request.'); }
  const parsed = editSchema.safeParse(raw); if (!parsed.success) throw new MemberError('Check the name, status and school years.');
  const input = parsed.data, db = memberService();
  const row = dbResult(await db.from('team_members').select('data').eq('id', input.id).maybeSingle());
  if (!row) throw new MemberError('Member not found.', 404);
  if ((row.data.updatedAt ?? '') !== input.expectedUpdatedAt) throw new MemberError('Another editor saved this member. Reload before saving.', 409);
  const updated = { ...row.data, name: input.name, status: input.status, academicYears: input.academicYears, updatedAt: new Date().toISOString() };
  const saved = dbResult(await db.from('team_members').update({data:updated}).eq('id',input.id).eq('data',JSON.stringify(row.data)).select('id').maybeSingle());
  if (!saved) throw new MemberError('Another editor saved this member. Reload before saving.', 409);
  dbResult(await db.from('member_access_audit').insert({actor:account.user_id,action:'roster:edit',target:input.id}));
  return NextResponse.json({ message: 'Member saved. Public website publication and login permissions are unchanged.' }, { headers: privateHeaders });
 } catch (error) { return failure(error); }
}
