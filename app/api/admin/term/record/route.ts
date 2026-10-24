import { NextRequest,NextResponse } from 'next/server';
import { guardMutation } from '@/lib/apiGuard';
import { supabase } from '@/lib/supabase';
import { termRecordSchema,validateTermRecord } from '@/lib/term/record';
import { termSchema } from '@/lib/term/schema';
export async function POST(request:NextRequest) {
 const guard=await guardMutation(request,termRecordSchema);if(!guard.ok)return guard.response;
 const headers={'Cache-Control':'private, no-store'};
 try {
  const stored=await supabase.from('term_workspaces').select('document').eq('id','2026-27-T1').single();if(stored.error)throw stored.error;
  const next=validateTermRecord(termSchema.parse(stored.data.document),guard.data);
  const record=next[guard.data.section].find(row=>row.id===guard.data.record.id);
  const {data,error}=await supabase.rpc('admin_term_record',{section:guard.data.section,record,expected_record:guard.data.expected});
  if(error)return NextResponse.json({error:error.code==='PT409'?'This item changed. Reload before saving; your draft is retained.':'Check this item and its group or owner assignments.'},{status:error.code==='PT409'?409:400,headers});
  return NextResponse.json({record:data,message:'Saved.'},{headers});
 }catch{return NextResponse.json({error:'Could not save this item. Check required fields, dates and completion evidence; your draft is retained.'},{status:400,headers});}
}
