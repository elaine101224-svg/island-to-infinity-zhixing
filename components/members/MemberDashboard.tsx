'use client';
import { useEffect,useRef,useState } from 'react';
import dynamic from 'next/dynamic';
import { memberRequest, MemberRequestError } from '@/lib/members/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberSignIn from './MemberSignIn';
import type {Workspace,MemberView,MemberTask} from '@/lib/members/workspace';
const MemberHome=dynamic(()=>import('./MemberHome'),{loading:()=> <main className="min-h-screen bg-cream p-6"><div role="status" className="max-w-5xl mx-auto space-y-5 animate-pulse motion-reduce:animate-none"><div className="h-7 w-36 bg-sand rounded"/><div className="h-36 bg-sand/40 rounded-2xl"/><span className="sr-only">Opening your tasks</span></div></main>});
export default function MemberDashboard({view='tasks'}:{view?:MemberView}){
 const [workspace,setWorkspace]=useState<Workspace|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const loadId=useRef(0);
 async function load(){const id=++loadId.current;setLoading(true);try{const next=await memberRequest('workspace');if(id!==loadId.current)return;setWorkspace(next);setError('');if(next.me.role==='admin'){const result=await memberRequest('admin-session',{});if(id===loadId.current)window.location.replace(result.redirect);}}catch(e){if(id!==loadId.current)return;if(e instanceof MemberRequestError&&[401,403].includes(e.status))setWorkspace(null);setError(e instanceof MemberRequestError&&e.status===401?'':(e as Error).message);}finally{if(id===loadId.current)setLoading(false);}}
 useEffect(()=>{void load();return()=>{++loadId.current;};},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(busy)return;++loadId.current;setLoading(false);setBusy(true);setError('');try{const result=await memberRequest('email-entry',{email});setMessage(result.message);await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!workspace)return <><Navbar/><MemberSignIn email={email} onEmail={setEmail} onSubmit={login} busy={busy} loading={loading} error={error} message={message} onRetry={()=>void load()}/><Footer/></>;
 return <MemberHome workspace={workspace} view={view} onTaskSaved={(task:MemberTask)=>setWorkspace(current=>current?{...current,tasks:current.tasks.map(row=>row.id===task.id?task:row)}:current)}/>;
}
