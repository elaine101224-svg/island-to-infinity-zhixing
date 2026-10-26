'use client';
import {useState} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const TeamProfiles=dynamic(()=>import('./TeamProfiles'),{loading:()=> <p role="status" className="text-sm text-earth-mid">Loading profiles…</p>});
const MemberAccess=dynamic(()=>import('@/components/members/MemberAccess'),{loading:()=> <p role="status" className="text-sm text-earth-mid">Loading authorization…</p>});
export default function MembersPage({view='profiles'}:{view?:'profiles'|'access'}){
 const [profilesOpened,setProfilesOpened]=useState(view==='profiles'),[accessOpened,setAccessOpened]=useState(view==='access');
 return <section className="max-w-6xl mx-auto space-y-6 text-earth-dark"><header className="console-page-heading"><div><h1>Members</h1><p>Profiles, contacts and login access.</p></div></header><nav aria-label="Member settings" className="flex flex-wrap gap-6 border-b border-sand"><Link href="/admin/members" aria-current={view==='profiles'?'page':undefined} onClick={()=>setProfilesOpened(true)} className={`min-h-12 py-3 border-b-2 text-sm ${view==='profiles'?'font-semibold border-earth-dark':'border-transparent text-earth-mid hover:text-earth-dark'}`}>Profiles &amp; Contacts</Link><Link href="/admin/members?view=access" aria-current={view==='access'?'page':undefined} onClick={()=>setAccessOpened(true)} className={`min-h-12 py-3 border-b-2 text-sm ${view==='access'?'font-semibold border-earth-dark':'border-transparent text-earth-mid hover:text-earth-dark'}`}>Login Authorization</Link></nav><div hidden={view!=='profiles'}>{(profilesOpened||view==='profiles')&&<TeamProfiles embedded/>}</div><div hidden={view!=='access'}>{(accessOpened||view==='access')&&<MemberAccess embedded/>}</div></section>;
}
