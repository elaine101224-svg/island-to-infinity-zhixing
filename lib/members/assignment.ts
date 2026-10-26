import {z} from 'zod';
import {termSchema,type Term} from '@/lib/term/schema';

export const newAssignedTaskSchema=z.object({id:z.uuid(),scopeId:z.string().min(1).max(100),title:z.string().trim().min(1).max(200),deliverable:z.string().trim().min(1).max(2000),ownerIds:z.array(z.string().min(1).max(100)).min(1).max(100).refine(ids=>new Set(ids).size===ids.length),due:z.iso.date().nullable(),dueAt:z.iso.datetime({offset:true}).nullable()}).strict();
export type NewAssignedTask=z.infer<typeof newAssignedTaskSchema>;

/** Admin-only caller; the database additionally checks current account eligibility. */
export function addAssignedTask(document:Term,input:NewAssignedTask,now:string):Term{
 const scope=document.scopes?.find(scope=>scope.id===input.scopeId);
 if(!scope||input.ownerIds.some(id=>![...scope.memberIds,...scope.coordinatorIds].includes(id)))throw Error('Select members of this family or project.');
 if(document.tasks.some(task=>task.id===input.id))throw Error('Task already exists.');
 return termSchema.parse({...document,tasks:[...document.tasks,{id:input.id,sourcePlan:'admin-assigned',sourceId:input.id,title:input.title,ownerId:input.ownerIds[0],collaboratorIds:input.ownerIds.slice(1),scopeId:scope.id,projectId:document.projects.some(project=>project.id===scope.id)?scope.id:null,groupId:null,eventId:null,due:input.due,dueAt:input.dueAt,priority:'Normal',status:'Awaiting confirmation',deliverable:input.deliverable,nextStep:input.deliverable,update:'',evidence:'',contributions:{},updatedAt:now}]});
}

export const coordinatorAssignmentSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),payload:newAssignedTaskSchema.extend({priority:z.enum(['Normal','High']).default('Normal')})}).strict(),
 z.object({action:z.literal('reassign'),payload:z.object({id:z.string().min(1).max(100),expectedUpdatedAt:z.string().min(1).max(100),ownerIds:z.array(z.string().min(1).max(100)).min(1).max(100).refine(ids=>new Set(ids).size===ids.length)}).strict()}).strict(),
]);
