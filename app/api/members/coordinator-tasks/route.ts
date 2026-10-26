import {NextRequest,NextResponse} from 'next/server';
import {requireMember,sameOrigin,privateHeaders,MemberError,memberLimit} from '@/lib/members/auth';
import {coordinatorAssignmentSchema} from '@/lib/members/assignment';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
 try{
  sameOrigin(request);
  if(Number(request.headers.get('content-length')??0)>16000)throw new MemberError('Task is too large.',413);
  let body:unknown;try{body=await request.json();}catch{throw new MemberError('Invalid task request.');}
  const input=coordinatorAssignmentSchema.safeParse(body);if(!input.success)throw new MemberError('Check the task, assignees and deadline.');
  const {client,account}=await requireMember();await memberLimit('scope-assignment:'+account.user_id,30,60);
  // The database checks live scope coordinator IDs, team membership and account eligibility.
  const {data,error}=await client.rpc('member_assign_scope_task',{action:input.data.action,payload:input.data.payload});
  if(error)throw new MemberError(error.code==='42501'?'You can only assign tasks within a team you coordinate.':error.code==='PT409'?'This task changed. Reload before trying again.':'Task was not assigned. Check current team members and the deadline.',error.code==='42501'?403:error.code==='PT409'?409:400);
  return NextResponse.json({record:data,message:'Task assigned.'},{headers:privateHeaders});
 }catch(error){return NextResponse.json({error:error instanceof MemberError?error.message:'Assignment could not be confirmed. Reload before retrying.'},{status:error instanceof MemberError?error.status:503,headers:privateHeaders});}
}
