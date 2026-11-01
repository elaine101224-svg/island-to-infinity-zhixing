import {workspaceSchoolYear} from '@/lib/term/schoolYears';
import type {Term} from '@/lib/term/schema';
import {memberService,dbResult} from './auth';
export async function readDirectoryState(){
 const db=memberService();const [profiles,accounts,workspace]=await Promise.all([db.from('team_members').select('id,data'),db.from('member_accounts').select('person_id,email,state,group_id'),db.from('term_workspaces').select('document').eq('id','2026-27-T1').maybeSingle()]);
 const scopes=(dbResult(workspace)?.document as Term|undefined)?.scopes??[];
 const memberships=dbResult(accounts)??[];
 const members=(dbResult(profiles)??[]).map(({id,data})=>{const account=memberships.find(account=>account.person_id===id);const assignments=scopes.filter(scope=>scope.memberIds.includes(id)||scope.coordinatorIds.includes(id)).map(scope=>({id:scope.id,title:scope.title,kind:scope.kind}));return {graduationYear:data.graduationYear??null,grade:data.grade??null,assignments,id,name:data.name,email:account?.email??data.email??'',position:data.role==='lead'?'leader':data.role==='coordinator'?'core':'member',status:data.status,academicYears:data.academicYears??[],updatedAt:data.updatedAt??'',groupId:account?.group_id??({'group-1':'A','group-2':'B','group-3':'C','group-4':'D'} as Record<string,string>)[data.groupId]??(['A','B','C','D'].includes(data.groupId)?data.groupId:null),loginState:account?.state??'not authorized'};});
 return {members,schoolYear:workspaceSchoolYear(dbResult(workspace)?.document??{})};
}

export async function readDirectory(){return (await readDirectoryState()).members;}
