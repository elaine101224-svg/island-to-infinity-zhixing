import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {validateSession} from '@/lib/auth';
import {guardMutation} from '@/lib/apiGuard';
import {memberService,dbResult,privateHeaders} from '@/lib/members/auth';
import {termSchema} from '@/lib/term/schema';
import {workspaceSchoolYear} from '@/lib/term/schoolYears';
const input=z.object({revision:z.number().int().positive(),schoolYear:z.string().regex(/^20\d{2}–\d{2}$/).refine(year=>(Number(year.slice(0,4))+1)%100===Number(year.slice(-2)))}).strict();
export async function GET(){
 if(!await validateSession())return NextResponse.json({error:'Unauthorized'},{status:401,headers:privateHeaders});
 try{const stored=dbResult(await memberService().from('term_workspaces').select('document,revision').eq('id','2026-27-T1').single());if(!stored)throw Error('Workspace unavailable');return NextResponse.json({revision:stored.revision,schoolYear:workspaceSchoolYear(stored.document)},{headers:privateHeaders});}catch{return NextResponse.json({error:'Could not load workspace settings.'},{status:503,headers:privateHeaders});}
}
export async function POST(request:NextRequest){
 const guarded=await guardMutation(request,input);if(!guarded.ok)return guarded.response;
 try{
  const db=memberService();const stored=dbResult(await db.from('term_workspaces').select('document,revision').eq('id','2026-27-T1').single());
  if(!stored)throw Error('Workspace unavailable');
  if(stored.revision!==guarded.data.revision)return NextResponse.json({error:'Workspace changed. Reload before saving.'},{status:409,headers:privateHeaders});
  const prior=termSchema.parse(stored.document),previousYear=workspaceSchoolYear(prior);
  const document=termSchema.parse({...prior,activeSchoolYear:guarded.data.schoolYear,tasks:prior.tasks.map(task=>({...task,schoolYear:task.schoolYear??previousYear}))});
  const saved=dbResult(await db.from('term_workspaces').update({document,revision:stored.revision+1}).eq('id','2026-27-T1').eq('revision',stored.revision).select('revision').maybeSingle());
  if(!saved)return NextResponse.json({error:'Workspace changed. Reload before saving.'},{status:409,headers:privateHeaders});
  return NextResponse.json({schoolYear:guarded.data.schoolYear,revision:saved.revision,message:'Current school year updated. Existing records retain their school years.'},{headers:privateHeaders});
 }catch{return NextResponse.json({error:'Settings were not confirmed. Reload before retrying.'},{status:503,headers:privateHeaders});}
}
