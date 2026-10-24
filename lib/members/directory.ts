import {memberService,dbResult} from './auth';
export async function readDirectory(){
 const db=memberService();const [profiles,accounts]=await Promise.all([db.from('team_members').select('id,data'),db.from('member_accounts').select('person_id,state,group_id')]);
 const memberships=dbResult(accounts)??[];
 return (dbResult(profiles)??[]).map(({id,data})=>{const account=memberships.find(account=>account.person_id===id);return {id,name:data.name,status:data.status,academicYears:data.academicYears??[],updatedAt:data.updatedAt??'',groupId:account?.group_id??({'group-1':'A','group-2':'B','group-3':'C','group-4':'D'} as Record<string,string>)[data.groupId]??(['A','B','C','D'].includes(data.groupId)?data.groupId:null),loginState:account?.state??'not authorized'};});
}
