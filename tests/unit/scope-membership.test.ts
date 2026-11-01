import {expect,it} from 'vitest';
import {createTermSeed} from '@/lib/term/seed';
import {updateScopeMembership,createWorkspaceScope} from '@/lib/members/scopeMembership';

function fixture(kind:'family'|'project'){
 const doc=createTermSeed();
 doc.people=[{id:'a',name:'Dummy A',groupId:null,availability:''},{id:'b',name:'Dummy B',groupId:null,availability:''}];
 const [a,b]=doc.people;
 const project=doc.projects[0];
 doc.scopes=[{id:project.id,title:project.title,kind,memberIds:[a.id],coordinatorIds:[a.id],coordinationRoles:[{memberId:a.id,label:'Coordinator'}],sourcePlan:'test',note:''}];
 doc.responsibilities=[{id:'role',scopeId:project.id,memberIds:[a.id],description:'Dummy responsibility',confirmation:'confirmed',sourcePlan:'test'}];
 doc.tutoringSeries=[{id:'series',scopeId:project.id,title:'Tutoring',memberIds:[a.id],frequency:'weekly',firstDate:null,startTime:null,locationRule:'',anchorConfirmed:false,sourcePlan:'test'}];
 project.participantIds=[a.id];
 doc.tasks=[{id:'task',title:'Existing work',ownerId:a.id,collaboratorIds:[b.id],scopeId:project.id,groupId:null,projectId:project.id,eventId:null,due:null,priority:'Normal',status:'In progress',update:'Draft ready',nextStep:'Review',evidence:'',updatedAt:'2026-10-29T00:00:00.000Z',contributions:{[a.id]:{status:'Completed',update:'Finished my part',nextStep:'',evidence:'Draft',updatedAt:'2026-10-29T00:00:00.000Z'}}}];
 return {doc,a,b,project};
}
it.each(['family','project'] as const)('updates %s membership and clears removed coordination roles while preserving task progress',kind=>{
 const {doc,a,b,project}=fixture(kind);
 const next=updateScopeMembership(doc,{scopeId:project.id,memberIds:[b.id]});
 expect(next.scopes![0]).toMatchObject({memberIds:[b.id],coordinatorIds:[],coordinationRoles:[]});
 expect(next.responsibilities![0].memberIds).toEqual([]);
 expect(next.tutoringSeries![0].memberIds).toEqual([]);
 expect(next.tasks).toEqual(doc.tasks);
 expect(next.events).toEqual(doc.events);
 expect(next.projects[0].participantIds).toEqual(kind==='project'?[b.id]:[a.id]);
 expect(doc.scopes![0].memberIds).toEqual([a.id]);
});
it('allows an empty team and preserves retained coordinators',()=>{
 const {doc,a,b,project}=fixture('project');
 expect(updateScopeMembership(doc,{scopeId:project.id,memberIds:[a.id,b.id]}).scopes![0].coordinatorIds).toEqual([a.id]);
 const empty=updateScopeMembership(doc,{scopeId:project.id,memberIds:[]});
 expect(empty.projects[0].participantIds).toEqual([]);
});
it('lets an administrator appoint coordinators only from the selected team',()=>{
 const {doc,a,b,project}=fixture('project');
 const next=updateScopeMembership(doc,{scopeId:project.id,memberIds:[a.id,b.id],coordinatorIds:[b.id]});
 expect(next.scopes![0].coordinatorIds).toEqual([b.id]);
 expect(()=>updateScopeMembership(doc,{scopeId:project.id,memberIds:[a.id],coordinatorIds:[b.id]})).toThrow('Coordinators must be team members');
});

it('creates an assignable private project without copying old members or publishing it',()=>{const {doc}=fixture('project');const id='f81d4fae-7dec-41d0-a765-00a0c91e6bf6';const next=createWorkspaceScope(doc,{id,kind:'project',title:'New team'});expect(next.scopes?.find(scope=>scope.id===id)).toMatchObject({memberIds:[],coordinatorIds:[]});expect(next.projects.find(project=>project.id===id)).toMatchObject({participantIds:[],privacy:'Internal planning'});expect(next.tasks).toEqual(doc.tasks);});
