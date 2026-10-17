import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import type { NextRequest } from 'next/server';
const mocks=vi.hoisted(()=>({ auth:vi.fn(), csrf:vi.fn(), upload:vi.fn(), download:vi.fn(), content:vi.fn() }));
vi.mock('@/lib/auth',()=>({validateSession:mocks.auth}));
vi.mock('@/lib/csrf',()=>({verifyCsrf:mocks.csrf}));
vi.mock('@/lib/supabase',()=>({supabase:{storage:{from:()=>({upload:mocks.upload,download:mocks.download})}}}));
vi.mock('@/lib/websiteContent',()=>({readPublishedContent:mocks.content,contentPhotoUrls:(c:{urls:string[]})=>new Set(c.urls)}));
import { POST } from '@/app/api/admin/uploads/route';
import { GET } from '@/app/api/uploads/[file]/route';
function request(file: File) {const form=new FormData();form.append('file',file);return new Request('https://site.test/api/admin/uploads',{method:'POST',body:form}) as NextRequest;}
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue(true);mocks.csrf.mockResolvedValue(null);mocks.upload.mockResolvedValue({error:null});mocks.content.mockResolvedValue({urls:[]});});
describe('persistent, private image storage',()=>{
 it('requires login and CSRF for uploads',async()=>{mocks.auth.mockResolvedValue(false);expect((await POST(request(new File(['x'],'x.png',{type:'image/png'})))).status).toBe(401);mocks.auth.mockResolvedValue(true);mocks.csrf.mockResolvedValue('missing');expect((await POST(request(new File(['x'],'x.png',{type:'image/png'})))).status).toBe(403);});
 it('rejects unsupported and forged images',async()=>{expect((await POST(request(new File(['x'],'x.svg',{type:'image/svg+xml'})))).status).toBe(415);expect((await POST(request(new File(['not a png'],'x.png',{type:'image/png'})))).status).toBe(415);expect(mocks.upload).not.toHaveBeenCalled();});
 it('rejects files larger than 4MB',async()=>{expect((await POST(request(new File([new Uint8Array(4*1024*1024+1)],'large.png',{type:'image/png'})))).status).toBe(413);});
 it('compresses to persistent WebP without cropping',async()=>{const input=await sharp({create:{width:3000,height:1000,channels:3,background:'#c4785a'}}).png().toBuffer();const res=await POST(request(new File([new Uint8Array(input)],'test.png',{type:'image/png'})));expect(res.status).toBe(201);const body=await res.json();expect(body.url).toMatch(/^\/api\/uploads\/[a-f0-9]{32}\.webp$/);const output=mocks.upload.mock.calls[0][1];const meta=await sharp(output).metadata();expect(meta.width).toBe(2400);expect(meta.height).toBe(800);expect(meta.exif).toBeUndefined();});
 it('returns a real error when storage fails',async()=>{mocks.upload.mockResolvedValue({error:{message:'down'}});const input=await sharp({create:{width:10,height:10,channels:3,background:'#fff'}}).png().toBuffer();expect((await POST(request(new File([new Uint8Array(input)],'test.png',{type:'image/png'})))).status).toBe(503);});
 it('rejects unsafe IDs and keeps unpublished photos private',async()=>{mocks.auth.mockResolvedValue(false);expect((await GET(new Request('https://site.test') as NextRequest,{params:Promise.resolve({file:'../../etc/passwd'})})).status).toBe(400);expect((await GET(new Request('https://site.test') as NextRequest,{params:Promise.resolve({file:'a'.repeat(32)+'.webp'})})).status).toBe(404);expect(mocks.download).not.toHaveBeenCalled();});
 it('serves only a published image to anonymous visitors',async()=>{const file='b'.repeat(32)+'.webp';mocks.auth.mockResolvedValue(false);mocks.content.mockResolvedValue({urls:[`/api/uploads/${file}`]});mocks.download.mockResolvedValue({data:new Blob(['webp']),error:null});const res=await GET(new Request('https://site.test') as NextRequest,{params:Promise.resolve({file})});expect(res.status).toBe(200);expect(res.headers.get('cache-control')).toContain('no-store');expect(res.headers.get('content-type')).toBe('image/webp');});
});
