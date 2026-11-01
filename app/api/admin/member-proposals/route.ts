import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {guardMutation} from '@/lib/apiGuard';
import {memberService,dbResult,privateHeaders} from '@/lib/members/auth';
const input=z.object({id:z.uuid(),expectedUpdatedAt:z.string().min(1).max(100)}).strict();
export async function POST(request:NextRequest){
 const guarded=await guardMutation(request,input);if(!guarded.ok)return guarded.response;
 try{
  const db=memberService();
  const prior=dbResult(await db.from('member_personal_plans').select('data,updated_at').eq('id',guarded.data.id).eq('kind','proposal').eq('shared',true).maybeSingle());
  if(!prior)return NextResponse.json({error:'Proposal not found.'},{status:404,headers:privateHeaders});
  if(prior.data.updatedAt!==guarded.data.expectedUpdatedAt)return NextResponse.json({error:'This proposal changed. Reload before reviewing.'},{status:409,headers:privateHeaders});
  const stamp=new Date().toISOString();
  const saved=dbResult(await db.from('member_personal_plans').update({data:{...prior.data,review:'Reviewed',updatedAt:stamp},updated_at:stamp}).eq('id',guarded.data.id).eq('kind','proposal').eq('shared',true).eq('updated_at',prior.updated_at).select('id').maybeSingle());
  if(!saved)return NextResponse.json({error:'This proposal changed. Reload before reviewing.'},{status:409,headers:privateHeaders});
  return NextResponse.json({message:'Marked as reviewed. Update the calendar separately if an activity is confirmed.'},{headers:privateHeaders});
 }catch{return NextResponse.json({error:'Review was not confirmed. Reload before retrying.'},{status:503,headers:privateHeaders});}
}
