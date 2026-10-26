import MemberDashboard from '@/components/members/MemberDashboard';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const {view}=await searchParams;return <MemberDashboard view={view==='calendar'?'calendar':view==='projects'?'projects':'tasks'}/>;}
