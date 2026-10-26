import MembersPage from '@/components/admin/MembersPage';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const {view}=await searchParams;return <MembersPage view={view==='access'?'access':'profiles'}/>;}
