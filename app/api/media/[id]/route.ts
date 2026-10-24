import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';
import { readContentState, readPublishedContent } from '@/lib/websiteContent';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[a-f0-9]{32}$/.test(id))return NextResponse.json({error:'Not found'},{status:404,headers});
 try {
  const admin=await validateSession();
  const content=admin?(await readContentState()).draft:await readPublishedContent(true);
  if(!content.documentary?.consent||content.documentary.url!==`/api/media/${id}`)return NextResponse.json({error:'Not found'},{status:404,headers});
  // Storage handles byte ranges and large responses. A short-lived URL avoids
  // buffering the film through the serverless response-size limit.
  const {data,error}=await supabase.storage.from('project-media-private').createSignedUrl(`${id}/documentary-2026.mp4`,120);
  if(error||!data)return NextResponse.json({error:'Video unavailable'},{status:503,headers});
  return new NextResponse(null,{status:307,headers:{...headers,Location:data.signedUrl}});
 }catch{return NextResponse.json({error:'Video unavailable'},{status:503,headers});}
}
