import {describe,it,expect,vi} from 'vitest';
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>undefined})}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>false}));
import {passwordHash,passwordMatches,credentials} from '@/lib/sewing/operations-server';
describe('controlled business password identity',()=>{
 it('salts passwords and verifies without saving reusable plaintext',async()=>{const a=await passwordHash('Isolated-only-long-password'),b=await passwordHash('Isolated-only-long-password');expect(a).not.toBe(b);expect(a).not.toContain('Isolated-only');expect(await passwordMatches('Isolated-only-long-password',a)).toBe(true);expect(await passwordMatches('wrong',a)).toBe(false);expect(await passwordMatches('wrong','')).toBe(false);});
 it('does not inherit ordinary school membership as a business session',async()=>{expect(await credentials()).toEqual({session_hash:'',admin_mode:false});});
});
