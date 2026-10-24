import { z } from 'zod';
const email=z.string().trim().toLowerCase().email().max(254);
export const loginSchema=z.object({email}).strict();
export const verifySchema=z.object({email,code:z.string().regex(/^\d{6,8}$/)}).strict();
export const changeSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('task'),payload:z.object({id:z.string().min(1).max(100),expectedUpdatedAt:z.string().min(1).max(100),status:z.enum(['Not started','In progress','Blocked','Completed']),update:z.string().max(2000),nextStep:z.string().max(2000),evidence:z.string().max(2000)}).strict()}).strict(),
 z.object({action:z.literal('assign'),payload:z.object({id:z.string().min(1).max(100),expectedUpdatedAt:z.string().min(1).max(100),ownerId:z.string().min(1).max(100).nullable()}).strict()}).strict(),
 z.object({action:z.literal('reflect'),payload:z.object({summary:z.string().trim().min(1).max(2000)}).strict()}).strict(),
 z.object({action:z.literal('review'),payload:z.object({id:z.string().min(1).max(100)}).strict()}).strict(),
]);
export const inviteSchema=z.object({email,personId:z.string().min(1).max(100),role:z.enum(['admin','coordinator','member']),groupId:z.enum(['A','B','C','D']).nullable()}).strict().refine(x=>x.role!=='coordinator'||x.groupId!==null,'Coordinators require a group');
export const accessSchema=z.object({userId:z.uuid(),expectedState:z.enum(['active','revoked','invited']),state:z.enum(['active','revoked','invited']),role:z.enum(['admin','coordinator','member'])}).strict();
