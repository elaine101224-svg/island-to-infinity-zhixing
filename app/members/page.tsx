import {cookies} from 'next/headers';
import MemberDashboard from '@/components/members/MemberDashboard';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){const [{view},jar]=await Promise.all([searchParams,cookies()]);const hasSavedSignIn=jar.getAll().some(({name})=>name==='iti-member-entry'||name==='iti-member-auth'||name.startsWith('iti-member-auth.'));return <MemberDashboard hasSavedSignIn={hasSavedSignIn} view={view==='calendar'?'calendar':view==='projects'?'projects':'tasks'}/>;}
