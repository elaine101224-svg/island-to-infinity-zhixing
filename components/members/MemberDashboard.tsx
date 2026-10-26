'use client';
import { useEffect,useRef,useState } from 'react';
import MemberHome from './MemberHome';
import { memberRequest, MemberRequestError } from '@/lib/members/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberSignIn from './MemberSignIn';
import type {Workspace,MemberView,MemberTask} from '@/lib/members/workspace';

export default function MemberDashboard({view='tasks',hasSavedSignIn=true}:{view?:MemberView;hasSavedSignIn?:boolean}){
 const [workspace,setWorkspace]=useState<Workspace|null>(null),[loading,setLoading]=useState(hasSavedSignIn),[error,setError]=useState(''),[email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const loadId=useRef(0);
 async function load(){const id=++loadId.current;setLoading(true);try{const next=await memberRequest('workspace');if(id!==loadId.current)return;setWorkspace(next);setError('');if(next.me.role==='admin'){const result=await memberRequest('admin-session',{});if(id===loadId.current)window.location.replace(result.redirect);}}catch(e){if(id!==loadId.current)return;if(e instanceof MemberRequestError&&[401,403].includes(e.status))setWorkspace(null);setError(e instanceof MemberRequestError&&e.status===401?'':(e as Error).message);}finally{if(id===loadId.current)setLoading(false);}}
 useEffect(()=>{if(hasSavedSignIn)void load();return()=>{++loadId.current;};},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(busy)return;++loadId.current;setLoading(false);setBusy(true);setError('');try{const result=await memberRequest('email-entry',{email});setMessage(result.message);if(result.workspace){setWorkspace(result.workspace);setLoading(false);}else await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!workspace&&loading&&hasSavedSignIn&&!error)return <main className="min-h-screen bg-cream p-5 sm:p-8" aria-busy="true"><div role="status" className="max-w-6xl mx-auto space-y-7 animate-pulse motion-reduce:animate-none"><span className="sr-only">Opening your workspace</span><div className="h-8 w-40 bg-sand rounded-lg"/><div className="h-4 w-64 max-w-full bg-sand/50 rounded"/><div className="h-64 border border-sand bg-white/60 rounded-xl"/><div className="h-32 border border-sand bg-sand/20 rounded-xl"/></div></main>;
 if(!workspace)return <><Navbar/><MemberSignIn email={email} onEmail={setEmail} onSubmit={login} busy={busy} loading={loading} error={error} message={message} onRetry={()=>void load()}/><Footer/></>;
 return <MemberHome workspace={workspace} view={view} onTaskSaved={(task:MemberTask)=>setWorkspace(current=>current?{...current,tasks:current.tasks.map(row=>row.id===task.id?task:row)}:current)}/>;
}
