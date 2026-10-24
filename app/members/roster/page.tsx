import MemberPageFrame from '@/components/members/MemberPageFrame';
import MemberDirectory from '@/components/admin/MemberDirectory';
export const dynamic='force-dynamic';
export default function Page(){return <MemberPageFrame><MemberDirectory/></MemberPageFrame>;}
