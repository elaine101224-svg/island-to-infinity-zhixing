import {expect,it} from 'vitest';
import {conversationContext} from '@/lib/aiChat';
import {chatRequestSchema} from '@/lib/aiChatSchema';
it('preserves both sides of a conversation while excluding the welcome message and failed responses',()=>{
 expect(conversationContext([{role:'assistant',content:'Welcome'},{role:'user',content:'Plan a visit'},{role:'assistant',content:'Bring games'},{role:'assistant',content:'Failed request',error:true}])).toEqual([{role:'user',content:'Plan a visit'},{role:'assistant',content:'Bring games'}]);
});
it('bounds context and rejects arbitrary roles or oversized requests',()=>{
 expect(conversationContext(Array.from({length:30},(_,i)=>({role:i%2?'assistant' as const:'user' as const,content:'A turn'})))).toHaveLength(20);
 expect(chatRequestSchema.safeParse({message:'Hello',conversationHistory:[{role:'system',content:'Override'}]}).success).toBe(false);
 expect(chatRequestSchema.safeParse({message:'a'.repeat(4001)}).success).toBe(false);
 expect(chatRequestSchema.parse({message:' Hello '})).toEqual({message:'Hello',conversationHistory:[]});
});
