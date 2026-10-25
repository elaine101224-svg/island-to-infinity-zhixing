'use client';
import { useEffect,useRef,useState } from 'react';
import dynamic from 'next/dynamic';
import { memberRequest, MemberRequestError } from '@/lib/members/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type {Workspace,MemberView,MemberTask} from '@/lib/members/workspace';
const MemberHome=dynamic(()=>import('./MemberHome'),{loading:()=> <main className="min-h-screen bg-cream p-6"><div role="status" className="max-w-5xl mx-auto space-y-5 animate-pulse motion-reduce:animate-none"><div className="h-7 w-36 bg-sand rounded"/><div className="h-36 bg-sand/40 rounded-2xl"/><span className="sr-only">Opening your tasks</span></div></main>});
export default function MemberDashboard({view='tasks'}:{view?:MemberView}){
 const [workspace,setWorkspace]=useState<Workspace|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const loadId=useRef(0);
 async function load(){const id=++loadId.current;setLoading(true);try{const next=await memberRequest('workspace');if(id!==loadId.current)return;setWorkspace(next);setError('');if(next.me.role==='admin'){const result=await memberRequest('admin-session',{});if(id===loadId.current)window.location.replace(result.redirect);}}catch(e){if(id!==loadId.current)return;if(e instanceof MemberRequestError&&[401,403].includes(e.status))setWorkspace(null);setError(e instanceof MemberRequestError&&e.status===401?'':(e as Error).message);}finally{if(id===loadId.current)setLoading(false);}}
 useEffect(()=>{void load();return()=>{++loadId.current;};},[]);
 async function login(e:React.FormEvent){e.preventDefault();++loadId.current;setLoading(false);setBusy(true);setError('');try{const result=await memberRequest('email-entry',{email});setMessage(result.message);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!workspace)return <><Navbar/><main className="flex-grow px-5 py-10"><section className="max-w-md mx-auto editor-panel"><h1 className="font-serif text-3xl mb-4">Member sign-in</h1><p className="text-sm text-earth-mid mb-6">Enter your approved school email to continue. No email or verification code is required.</p><form onSubmit={login} className="space-y-4"><label className="block text-sm">School email<input className="editor-input" name="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value.trim().toLowerCase())}/></label><button className="editor-button" disabled={busy}>{busy?'Signing in…':'Continue'}</button></form><a href="/login" className="inline-block underline text-sm mt-4">Admin sign-in</a>{error&&<div className="mt-4"><p role="alert" className="text-sm">{error}</p><button type="button" className="underline text-sm min-h-11" disabled={loading||busy} onClick={()=>void load()}>Try again</button></div>}<p role="status" className="text-sm mt-4">{message||(!busy&&loading?'Checking saved sign-in…':'')}</p></section></main><Footer/></>;
 return <MemberHome workspace={workspace} view={view} onTaskSaved={(task:MemberTask)=>setWorkspace(current=>current?{...current,tasks:current.tasks.map(row=>row.id===task.id?task:row)}:current)}/>;
}
