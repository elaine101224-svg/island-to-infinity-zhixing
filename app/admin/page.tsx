import AdminOverview from '@/components/admin/AdminOverview';
import {isDeepStrictEqual} from 'node:util';
import {getTeamMembers} from '@/lib/data';
import {supabase} from '@/lib/supabase';
import {readContentState} from '@/lib/websiteContent';
import {publicDocument,publicMembers,homepageSchema} from '@/lib/contentSchema';
import {withReviewedCalendar} from '@/lib/term/publication';
import {termSchema} from '@/lib/term/schema';
export const dynamic='force-dynamic';
export default async function Page(){
 const [term,content,members]=await Promise.all([supabase.from('term_workspaces').select('document').eq('id','2026-27-T1').single(),readContentState(),getTeamMembers()]);
 if(term.error)return <p role="alert">Today’s work could not be loaded. Please reload.</p>;
 const doc=termSchema.parse(term.data.document);
 const publicDraft=publicDocument(content.draft);let calendarChanged=false;try{calendarChanged=!isDeepStrictEqual(publicDraft.cards,withReviewedCalendar(publicDraft,doc.events).cards);}catch{calendarChanged=true;}
 const websiteChanged=!content.published||!isDeepStrictEqual({...publicDraft,members:publicMembers(members,content.draft.schoolYear)},homepageSchema.parse(content.published))||calendarChanged;
 return <AdminOverview document={doc} websiteChanged={websiteChanged} now={new Date()}/>;
}
