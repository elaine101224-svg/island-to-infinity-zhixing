import {beforeEach,describe,it,expect,vi} from 'vitest';
import {defaultHomepage} from '@/lib/contentSchema';
const m=vi.hoisted(()=>({admin:false,consent:true,signed:vi.fn(async()=>({data:{signedUrl:'https://storage.example.test/video'},error:null}))}));
vi.mock('@/lib/auth',()=>({validateSession:async()=>m.admin}));
vi.mock('@/lib/supabase',()=>({supabase:{storage:{from:()=>({createSignedUrl:m.signed})}}}));
vi.mock('@/lib/websiteContent',()=>({readPublishedContent:vi.fn(async()=>({...defaultHomepage,documentary:{url:'/api/media/'+ 'a'.repeat(32),title:'Film',caption:'',consent:m.consent}})),readContentState:async()=>({draft:defaultHomepage})}));
import {GET} from '@/app/api/media/[id]/route';
import {readPublishedContent} from '@/lib/websiteContent';
beforeEach(()=>{m.consent=true;m.admin=false;m.signed.mockClear();});
describe('documentary publication boundary',()=>{
 it('checks fresh authorization and redirects to a short-lived range-capable storage link',async()=>{const r=await GET(new Request('https://site.test'),{params:Promise.resolve({id:'a'.repeat(32)})});expect(r.status).toBe(307);expect(readPublishedContent).toHaveBeenCalledWith(true);expect(m.signed).toHaveBeenCalledWith('a'.repeat(32)+'/documentary-2026.mp4',120);expect(r.headers.get('cache-control')).toContain('no-store');});
 it('blocks new links immediately after authorization withdrawal',async()=>{m.consent=false;expect((await GET(new Request('https://site.test'),{params:Promise.resolve({id:'a'.repeat(32)})})).status).toBe(404);expect(m.signed).not.toHaveBeenCalled();});
 it.each(['b'.repeat(32),'../private'])('rejects unpublished or invalid object %s',async id=>{expect((await GET(new Request('https://site.test'),{params:Promise.resolve({id})})).status).toBe(404);expect(m.signed).not.toHaveBeenCalled();});
});
