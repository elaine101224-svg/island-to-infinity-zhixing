import {z} from 'zod';
import {termSchema,type Term} from '@/lib/term/schema';

export const scopeMembershipSchema=z.object({
 scopeId:z.string().min(1).max(100),
 coordinatorIds:z.array(z.string().min(1).max(100)).max(10).refine(ids=>new Set(ids).size===ids.length).optional(),
 memberIds:z.array(z.string().min(1).max(100)).max(100).refine(ids=>new Set(ids).size===ids.length),
}).strict();

export function updateScopeMembership(document:Term,input:z.infer<typeof scopeMembershipSchema>):Term{
 const next=structuredClone(document);
 const scope=next.scopes?.find(scope=>scope.id===input.scopeId);
 if(!scope)throw Error('Unknown family or project.');
 if(input.memberIds.some(id=>!next.people.some(person=>person.id===id)))throw Error('Unknown member.');
 scope.memberIds=[...input.memberIds];
 if(input.coordinatorIds?.some(id=>!input.memberIds.includes(id)))throw Error('Coordinators must be team members.');
 const coordinators=input.coordinatorIds??scope.coordinatorIds.filter(id=>input.memberIds.includes(id));
 if(input.coordinatorIds&&JSON.stringify([...scope.coordinatorIds].sort())!==JSON.stringify([...coordinators].sort()))delete scope.coordinationRoles;
 scope.coordinatorIds=coordinators;
 if(scope.coordinationRoles)scope.coordinationRoles=scope.coordinationRoles.filter(role=>input.memberIds.includes(role.memberId));
 const project=next.projects.find(project=>project.id===scope.id);
 if(scope.kind==='project'&&project)project.participantIds=[...input.memberIds];
 for(const responsibility of next.responsibilities??[]){
  if(responsibility.scopeId===scope.id)responsibility.memberIds=responsibility.memberIds.filter(id=>input.memberIds.includes(id));
 }
 for(const series of next.tutoringSeries??[]){
  if(series.scopeId===scope.id)series.memberIds=series.memberIds.filter(id=>input.memberIds.includes(id));
 }
 return termSchema.parse(next);
}

export const createScopeSchema=z.object({id:z.uuid(),title:z.string().trim().min(1).max(200),kind:z.enum(['family','project'])}).strict();
export function createWorkspaceScope(document:Term,input:z.infer<typeof createScopeSchema>):Term{
 if(document.scopes?.some(scope=>scope.id===input.id)||document.projects.some(project=>project.id===input.id))throw Error('Team already exists.');
 return termSchema.parse({...document,scopes:[...(document.scopes??[]),{...input,memberIds:[],coordinatorIds:[],note:'',sourcePlan:'admin-created'}],projects:input.kind==='project'?[...document.projects,{id:input.id,title:input.title,description:'',owners:'',interestSnapshot:'',interestedIds:[],participantIds:[],start:'',end:'',milestones:'',status:'Not Started',evidence:'',nextAction:'',privacy:'Internal planning'}]:document.projects});
}
