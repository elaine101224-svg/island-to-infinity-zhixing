import { readContentState } from '@/lib/websiteContent';
import { publicDocument, publicMembers } from '@/lib/contentSchema';
import PublishedHome from '@/components/home/PublishedHome';
import { getTeamMembers } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Preview() {
  const {draft} = await readContentState();
  const content = publicDocument(draft);
  const members = await getTeamMembers();
  content.members = publicMembers(members,content.schoolYear);
  return <><p className="bg-sand p-4 rounded-lg font-medium">Private preview of the saved draft · Changes are not public until published.</p><PublishedHome content={content} /></>;
}
