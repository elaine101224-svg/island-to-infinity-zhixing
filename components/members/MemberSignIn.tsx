'use client';

import Link from 'next/link';
import {ArrowRight,CalendarDays,ClipboardList,Layers,Mail,AlertCircle} from 'lucide-react';

export default function MemberSignIn({email,onEmail,onSubmit,busy,loading,error,message,onRetry}:{email:string;onEmail:(value:string)=>void;onSubmit:(event:React.FormEvent)=>void;busy:boolean;loading:boolean;error:string;message:string;onRetry:()=>void}){
 const status=busy?'Opening your workspace…':message||(loading?'Checking your saved sign-in…':'');
 return <main className="member-entry">
  <div className="member-entry-layout">
   <section className="member-entry-welcome" aria-labelledby="member-welcome">
    <p className="member-entry-eyebrow">MEMBER WORKSPACE <span>2026–27</span></p>
    <h1 id="member-welcome">Welcome back.</h1>
    <p className="member-entry-intro">Your next steps, your team, and the time you make for them.</p>
    <ul className="member-entry-overview" aria-label="Inside your workspace">
     <li><span data-tone="clay"><ClipboardList size={19} aria-hidden="true"/></span><div><strong>My Tasks</strong><p>Your family plan and personal to-dos</p></div></li>
     <li><span data-tone="sage"><Layers size={19} aria-hidden="true"/></span><div><strong>My Projects</strong><p>Your teams and assigned work</p></div></li>
     <li><span data-tone="amber"><CalendarDays size={19} aria-hidden="true"/></span><div><strong>My Calendar</strong><p>Team activities and your own plans</p></div></li>
    </ul>
   </section>
   <section className="member-entry-form" aria-labelledby="member-sign-in">
    <div className="member-entry-form-heading"><span className="member-entry-mail"><Mail size={22} aria-hidden="true"/></span><h2 id="member-sign-in">Member sign-in</h2><p>Use the school email on your member profile.</p></div>
    <form onSubmit={onSubmit} aria-busy={busy}>
     <label htmlFor="member-email">School email</label>
     <input id="member-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="you@uwcchina.org" value={email} readOnly={busy} onChange={event=>onEmail(event.target.value.trim().toLowerCase())} aria-describedby={`member-email-hint${error?' member-sign-in-error':''}`} aria-invalid={error?true:undefined}/>
     <p id="member-email-hint" className="member-entry-hint">No password or verification code needed.</p>
     {error&&<div id="member-sign-in-error" className="member-entry-error" role="alert"><AlertCircle size={17} aria-hidden="true"/><p>{error}</p></div>}
     <button type="submit" className="member-entry-submit" disabled={busy}>{busy?'Signing in…':'Open my workspace'}<ArrowRight size={18} aria-hidden="true"/></button>
     <p role="status" aria-live="polite" className="member-entry-status">{status}</p>
    </form>
    <div className="member-entry-help"><p>Need access? Contact Elaine or Jasmine.</p>{error&&<button type="button" disabled={loading||busy} onClick={onRetry}>Check saved sign-in</button>}<Link href="/login">Admin sign-in <ArrowRight size={13} aria-hidden="true"/></Link></div>
   </section>
  </div>
 </main>;
}
