import { z } from 'zod';
export const activityInput=z.object({id:z.uuid().optional(),expectedUpdatedAt:z.string().max(100).optional(),title:z.string().trim().min(1).max(200),date:z.iso.date(),summary:z.string().trim().min(1).max(2000),nextStep:z.string().trim().max(1000),eventId:z.string().max(100).nullable()}).strict().refine(value=>!value.id||!!value.expectedUpdatedAt,'Reload this record before editing');
export type MemberActivity={id:string;title:string;date:string;summary:string;nextStep:string;eventId:string|null;updatedAt:string};
