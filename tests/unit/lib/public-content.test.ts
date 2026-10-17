import { describe,it,expect } from 'vitest';
import { defaultHomepage, publicDocument, emptyPhoto, homepageSchema } from '@/lib/contentSchema';
import { currentSchoolYear,inSchoolYear } from '@/lib/schoolYear';
import { teamMemberUpsertSchema } from '@/lib/validation';
describe('public editorial boundary',()=>{
 it('does not publish unchecked photos, hidden groups or draft cards',()=>{const doc=publicDocument({...defaultHomepage,teamPhoto:{url:'/api/uploads/'+ 'a'.repeat(32)+'.webp',alt:'Team',caption:'',consent:false},cards:[{id:'private',sourceId:'internal',kind:'family',title:'Private draft',summary:'private notes',date:'',photo:emptyPhoto,published:false}]});expect(doc.teamPhoto.url).toBe('');expect(doc.groups).toEqual([]);expect(doc.cards).toEqual([]);});
 it('rejects blobs, data URLs and external images for public profiles',()=>{for(const url of ['blob:x','data:image/png;base64,x','https://external.test/face.jpg'])expect(homepageSchema.safeParse({...defaultHomepage,teamPhoto:{...emptyPhoto,url}}).success).toBe(false);});
 it('new or legacy members default to private with unassigned school year',()=>{const m=teamMemberUpsertSchema.parse({name:'A',role:'volunteer',status:'active',joinedDate:''});expect(m.isPublic).toBe(false);expect(m.academicYears).toEqual([]);expect(m.publicRole).toBe('');});
});
describe('school-year scopes',()=>{
 it('rolls over in August and never includes prior-year events',()=>{expect(currentSchoolYear(new Date('2026-07-31'))).toBe('2025–26');expect(currentSchoolYear(new Date('2026-08-01'))).toBe('2026–27');expect(inSchoolYear('2026-05-01','2026–27')).toBe(false);expect(inSchoolYear('2026-10-18','2026–27')).toBe(true);expect(inSchoolYear('2027-08-01','2026–27')).toBe(false);});
});

describe('member publication',()=>{
 it('does not infer roles, years or names and strips private fields',async()=>{
  const {publicMembers}=await import('@/lib/contentSchema');
  const base={id:'a',name:'Internal A',role:'lead' as const,email:'secret@example.test',phone:'1234',status:'active' as const,assignedFamilyIds:['private-family'],joinedDate:'',notes:'private',createdAt:'',updatedAt:'',academicYears:['2026–27'],publicName:'Public A',publicRole:'Volunteer',isPublic:true};
  expect(publicMembers([{...base,academicYears:[]}], '2026–27')).toEqual([]);
  expect(publicMembers([{...base,isPublic:false}], '2026–27')).toEqual([]);
  expect(publicMembers([{...base,status:'inactive'}], '2026–27')).toEqual([]);
  expect(publicMembers([base],'2026–27')).toEqual([{id:'a',name:'Public A',role:'Volunteer',groupId:'',photoUrl:''}]);
 });
 it('excludes cancelled, optional, future, recorded and historical activities by default',async()=>{
  const {needsRecording}=await import('@/lib/schoolYear');const event={id:'a',date:'2026-10-01'};const ids=new Set<string>();
  expect(needsRecording(event,ids,'2026–27','2026-10-18')).toBe(true);
  for(const e of [{...event,status:'cancelled'},{...event,requiresRecord:false},{...event,date:'2026-05-01'},{...event,date:'2027-01-01'}])expect(needsRecording(e,ids,'2026–27','2026-10-18')).toBe(false);
  expect(needsRecording(event,new Set(['a']),'2026–27','2026-10-18')).toBe(false);
  expect(needsRecording({...event,date:'2026-05-01'},ids,'2026–27','2026-10-18',true)).toBe(true);
 });
});
