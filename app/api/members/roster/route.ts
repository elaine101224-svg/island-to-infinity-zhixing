import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberError, memberService, sameOrigin, privateHeaders, dbResult } from '@/lib/members/auth';
import { readDirectory } from '@/lib/members/directory';
import { randomUUID } from 'node:crypto';
import { requireRosterEditor } from '@/lib/members/roster';
export const dynamic = 'force-dynamic';
const schoolYear = z.string().regex(/^20\d{2}–\d{2}$/);
const editSchema = z.object({ contactEmail:z.string().trim().max(254).refine(value=>value===''||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),'Use a valid email').optional(),position:z.enum(['leader','core','member']).optional(), id: z.string().min(1).max(100).optional(), expectedUpdatedAt: z.string().max(100).optional(), groupId:z.enum(['A','B','C','D']).nullable().optional(), name: z.string().trim().min(1).max(100), status: z.enum(['active','inactive']), academicYears: z.array(schoolYear).min(1).max(20) }).strict();
function failure(error: unknown) { return NextResponse.json({ error: error instanceof MemberError ? error.message : 'The roster could not be saved. Please retry.' }, { status: error instanceof MemberError ? error.status : 503, headers: privateHeaders }); }
export async function GET() {
 try {
  await requireRosterEditor();
  return NextResponse.json({members:await readDirectory(),canEdit:true},{headers:privateHeaders});
 } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
 try {
  sameOrigin(request); const { account } = await requireRosterEditor();
  if (Number(request.headers.get('content-length') ?? 0) > 10000) throw new MemberError('Request too large.', 413);
  let raw: unknown; try { raw = await request.json(); } catch { throw new MemberError('Invalid JSON request.'); }
  const parsed = editSchema.safeParse(raw); if (!parsed.success) throw new MemberError('Check the name, status and school years.');
  const input = parsed.data, db = memberService();
  if (!input.id) {
   const directory=await readDirectory();if(directory.some(person=>person.name.trim().toLowerCase()===input.name.trim().toLowerCase()&&person.academicYears.some((year:string)=>input.academicYears.includes(year))))throw new MemberError('This member already exists. Find and edit the existing entry.',409);
   const id='team-'+randomUUID(), now=new Date().toISOString();
   const data={id,name:input.name,status:input.status,academicYears:input.academicYears,groupId:input.groupId??'',role:input.position==='leader'?'lead':input.position==='core'?'coordinator':'volunteer',email:input.contactEmail??'',phone:'',notes:'',assignedFamilyIds:[],joinedDate:'',publicName:'',publicRole:'',photoUrl:'',photoConsent:false,isPublic:false,displayOrder:0,createdAt:now,updatedAt:now};
   dbResult(await db.from('team_members').insert({id,data}));
   dbResult(await db.from('member_access_audit').insert({actor:account.user_id,action:'roster:create',target:id}));
   return NextResponse.json({message:'Member added to the directory. Login access has not been granted.'},{status:201,headers:privateHeaders});
  }
  if(input.expectedUpdatedAt===undefined)throw new MemberError('Reload this member before editing.');
  const row = dbResult(await db.from('team_members').select('data').eq('id', input.id).maybeSingle());
  if (!row) throw new MemberError('Member not found.', 404);
  if ((row.data.updatedAt ?? '') !== input.expectedUpdatedAt) throw new MemberError('Another editor saved this member. Reload before saving.', 409);
  const updated = { ...row.data, name: input.name, status: input.status, ...(input.position?{role:input.position==='leader'?'lead':input.position==='core'?'coordinator':'volunteer'}:{}),...(input.contactEmail!==undefined?{email:input.contactEmail}:{}), academicYears: input.academicYears, ...(input.groupId!==undefined?{groupId:input.groupId??''}:{}), updatedAt: new Date().toISOString() };
  const write=await db.from('team_members').update({data:updated}).eq('id',input.id).eq('data',JSON.stringify(row.data)).select('id').maybeSingle();
  if(write.error?.message.includes('Reassign existing'))throw new MemberError('Reassign this member’s existing group tasks and responsibilities in Semester before moving groups.');
  const saved = dbResult(write);
  if (!saved) throw new MemberError('Another editor saved this member. Reload before saving.', 409);
  dbResult(await db.from('member_access_audit').insert({actor:account.user_id,action:'roster:edit',target:input.id}));
  return NextResponse.json({ message: 'Member saved. Public website publication and login permissions are unchanged.' }, { headers: privateHeaders });
 } catch (error) { return failure(error); }
}
