import { z } from 'zod';

// All public content is a separate editorial document. Internal database rows
// are never spread into it; member entries are projected at publication time.
export const imageUrl = z.string().max(2048).refine(v => v === '' || /^\/api\/uploads\/[a-f0-9]{32}\.webp$/.test(v) || /^\/images\/[a-zA-Z0-9/_.-]+$/.test(v), 'Use an uploaded photo or an existing site image');
export const contentPhotoSchema = z.object({
  url: imageUrl.default(''), alt: z.string().trim().max(300).default(''),
  caption: z.string().max(500).default(''), consent: z.boolean().default(false),
});
export const publicCardSchema = z.object({
  schoolEvent:z.boolean().optional(),participationStatus:z.enum(['TBC','Confirmed','Not participating']).optional(),
  calendarEventId:z.string().max(100).optional(), planningStatus:z.enum(['Confirmed','Proposed','Tentative','Available slot','Awaiting approval','Completed','Cancelled']).optional(),
  id: z.string().min(1).max(120), sourceId: z.string().max(120).default(''),
  kind: z.enum(['family', 'plan', 'event', 'update']), title: z.string().trim().min(1).max(200),
  summary: z.string().max(2000).default(''), date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(''),
  eventType: z.enum(['field_trip', 'visit', 'event', 'meeting']).optional(),
  startTime: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  venue: z.string().trim().max(300).optional(),
  photo: contentPhotoSchema, published: z.boolean().default(false),
});
export const publicMemberSchema = z.object({
  id: z.string(), name: z.string(), role: z.string(), groupId: z.string(), photoUrl: imageUrl,
});
export const emptyDocumentary = { url: '', title: 'Island to Infinity · Zhixing documentary', caption: '', consent: false };
export const documentarySchema = z.object({
  url: z.string().regex(/^$|^\/api\/media\/[a-f0-9]{32}$/),
  title: z.string().trim().min(1).max(150), caption: z.string().max(500), consent: z.boolean(),
});
export const publicProjectSchema=z.object({
 id:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),title:z.string().trim().min(1).max(200),
 category:z.enum(['library','photography','market','workshop','sewing','documentary']),
 summary:z.string().trim().max(240),description:z.string().trim().max(3000),
 status:z.enum(['Planned','Preparing','In progress','Completed','On hold']),progress:z.string().trim().max(1200),timing:z.string().trim().max(500),
 nextSteps:z.array(z.string().trim().min(1).max(500)).max(20),
 team:z.array(z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(100),role:z.string().trim().min(1).max(80)}).strict()).max(100),
 photo:contentPhotoSchema,published:z.boolean(),
}).strict().refine(project=>new Set(project.team.map(member=>member.id)).size===project.team.length,'Duplicate project team member');
export type PublicProject=z.infer<typeof publicProjectSchema>;
export const homepageSchema = z.object({
  title: z.string().trim().min(1).max(150), intro: z.string().trim().min(1).max(800),
  schoolYear: z.string().regex(/^\d{4}–\d{2}$/), foundingYear: z.string().regex(/^\d{4}$/),
  about: z.string().max(1500), teamPhoto: contentPhotoSchema,
  documentary: documentarySchema.default(emptyDocumentary),
  photoPosition: z.enum(['hero', 'team']),
  groups: z.array(z.object({ id: z.string().min(1), name: z.string().max(120), description: z.string().max(1000), photo: contentPhotoSchema, visible: z.boolean() })).max(4),
  history: z.array(z.object({ id: z.string().min(1), year: z.string().max(20), title: z.string().max(150), photo: contentPhotoSchema, visible: z.boolean() })).max(40),
  cards: z.array(publicCardSchema).max(200),
  members: z.array(publicMemberSchema).max(500).default([]),
  projects:z.array(publicProjectSchema).max(50).default([]).refine(projects=>new Set(projects.map(project=>project.id)).size===projects.length,'Duplicate project ID'),
});
export type HomepageContent = z.infer<typeof homepageSchema>;
export type ContentPhoto = z.infer<typeof contentPhotoSchema>;
export type PublicCard = z.infer<typeof publicCardSchema>;
export const emptyPhoto: ContentPhoto = { url: '', alt: '', caption: '', consent: false };
export const defaultHomepage: HomepageContent = {
  title: 'Island to Infinity', schoolYear: '2026–27', foundingYear: '2024',
  intro: 'A student-led project at UWC Changshu. Through regular visits and shared activities, we build lasting connections with local families.',
  about: "We are a student-led project at UWC Changshu, working with the Changshu Women’s Federation. Through sustained companionship, home visits, and activities we plan together, we support local families and learn from one another.",
  documentary: emptyDocumentary, teamPhoto: emptyPhoto, photoPosition: 'hero', members: [], projects:[],
  groups: [1,2,3,4].map(n => ({ id: `group-${n}`, name: `Family group ${n}`, description: '', photo: emptyPhoto, visible: false })),
  history: [
    { id: 'history-2024', year: '2024', title: 'Our founding year', photo: { url: '/images/members/2024.jpg', alt: 'Island to Infinity team in 2024', caption: 'The team in our founding year.', consent: true }, visible: true },
    { id: 'history-2025', year: '2025', title: 'Growing together', photo: { url: '/images/members/2025.jpg', alt: 'Island to Infinity team in 2025', caption: 'A previous Island to Infinity team.', consent: true }, visible: true },
  ], cards: [],
};

export function photoIsPublic(photo: ContentPhoto) { return !!photo.url && photo.consent && !!photo.alt.trim(); }

export function publicDocument(content: HomepageContent): HomepageContent {
  return {
    ...content, documentary: content.documentary?.consent ? content.documentary : { ...emptyDocumentary }, teamPhoto: photoIsPublic(content.teamPhoto) ? content.teamPhoto : { ...emptyPhoto },
    groups: content.groups.filter(g => g.visible).map(g => ({ ...g, photo: photoIsPublic(g.photo) ? g.photo : { ...emptyPhoto } })),
    history: content.history.filter(h => h.visible && photoIsPublic(h.photo)),
    cards: content.cards.filter(c => c.published).map(c => ({ ...c, photo: photoIsPublic(c.photo) ? c.photo : { ...emptyPhoto } })),
    projects:content.projects.filter(project=>project.published).map(project=>({...project,photo:photoIsPublic(project.photo)?project.photo:{...emptyPhoto}})),
  };
}

export function publicMembers(members: import('@/types').TeamMember[], year: string) {
  return members.filter(m => m.isPublic && m.status === 'active' && m.academicYears?.includes(year) && m.publicName?.trim()).sort((a,b)=>(a.displayOrder||0)-(b.displayOrder||0)).map(m=>({id:m.id,name:m.publicName!,role:m.publicRole||'',groupId:({'A':'group-1','B':'group-2','C':'group-3','D':'group-4'} as Record<string,string>)[m.groupId||'']||m.groupId||'',photoUrl:m.photoConsent?(m.photoUrl||''):''}));
}
