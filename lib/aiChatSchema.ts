import {z} from 'zod';
export const chatRequestSchema=z.object({message:z.string().trim().min(1).max(4000),conversationHistory:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().trim().min(1).max(6000)}).strict()).max(20).default([])}).strict();
