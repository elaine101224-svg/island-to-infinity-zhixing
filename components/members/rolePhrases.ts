import type {Workspace} from '@/lib/members/workspace';
// Presentation labels only. Full responsibilities remain in the planning record.
const labels:Record<string,string[]>={
 R01:['Family coordination'],R02:['Scheduling','Field trips'],R03:['English & hobbies'],R04:['Mathematics tutoring'],R05:['Family coordination'],R06:['Academic support'],R07:['History & politics','Purchase list'],R08:['Library collaboration'],R09:['Library coordination'],R10:['Booth planning','Procurement & setup'],R11:['Project member'],R12:['Supporting coordinator'],R13:['Project member'],R14:['Workshop member'],R15:['Workshop coordination'],R16:['Workshop member'],R17:['Workshop coordination'],R18:['Sewing cooperation'],R19:['Documentary planning'],
 'market-lead':['Lead coordinator'],'tutor-lead':['Tutor roster','Tutor training'],'study-planning':['Subject-lead selection'],
};
export function rolePhrases(scope:Workspace['scopes'][number],roles:Workspace['responsibilities'],personId:string){
 const phrases=roles.filter(role=>role.scopeId===scope.id&&role.memberIds.includes(personId)).flatMap(role=>labels[role.id.split(':role:').at(-1)??'']??[]);
 if(phrases.length)return [...new Set(phrases)].slice(0,3);
 return [scope.coordinationRoles?.find(role=>role.memberId===personId)?.label??(scope.coordinatorIds.includes(personId)?'Coordinator':scope.kind==='family'?'Family support':'Project member')];
}
