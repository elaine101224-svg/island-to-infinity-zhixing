import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { guardMutation } from '@/lib/apiGuard';
import { supabase } from '@/lib/supabase';
import { createTermSeed } from '@/lib/term/seed';
import { saveTermSchema, termSchema } from '@/lib/term/schema';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request?: NextRequest) {
 if (!await validateSession()) return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 if(request?.nextUrl.searchParams.get('preview')==='true')return NextResponse.json({document:createTermSeed(),revision:0,initialized:false},{headers});
 if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:'Term storage needs a server-only service role key. No data was loaded.'},{status:503,headers});
 try {
  const {data,error} = await supabase.from('term_workspaces').select('document,revision').eq('id','2026-27-T1').maybeSingle();
  if (error) throw error;
  return NextResponse.json(data ? {...data,document:termSchema.parse(data.document),initialized:true} : {document:createTermSeed(),revision:0,initialized:false},{headers});
 } catch { return NextResponse.json({error:'Term storage unavailable. Apply the reviewed staging SQL setup before saving.'},{status:503,headers}); }
}
export async function PUT(request: NextRequest) {
 const guard = await guardMutation(request,saveTermSchema);
 if (!guard.ok) return guard.response;
 if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:'Server storage is not configured.'},{status:503,headers});
 const {document,revision} = guard.data;
 try {
  const query = revision === 0
   ? supabase.from('term_workspaces').insert({id:'2026-27-T1',document,revision:1})
   : supabase.from('term_workspaces').update({document,revision:revision+1}).eq('id','2026-27-T1').eq('revision',revision);
  const {data,error} = await query.select('revision').maybeSingle();
  if (error?.code === '23505' || (!error && !data)) return NextResponse.json({error:'Another editor saved this workspace. Reload before saving; your draft is still on screen.'},{status:409,headers});
  if (error || !data) throw error;
  return NextResponse.json({revision:data.revision,initialized:true},{headers});
 } catch {return NextResponse.json({error:'Save failed. Your draft remains on screen; retry before leaving.'},{status:503,headers});}
}
