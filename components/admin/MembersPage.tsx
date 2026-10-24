'use client';
import {useState} from 'react';
import MemberDirectory from './MemberDirectory';
import MemberAccess from '@/components/members/MemberAccess';
export default function MembersPage(){const [accessOpen,setAccessOpen]=useState(false);return <div className="max-w-5xl mx-auto space-y-6"><header><h1 className="font-serif text-3xl">Members</h1><p className="text-earth-mid mt-2">One directory for people, groups and login status.</p></header><MemberDirectory/><details className="border-t border-sand pt-4" onToggle={event=>{if(event.currentTarget.open)setAccessOpen(true);}}><summary className="cursor-pointer min-h-11">Login authorization & account settings</summary>{accessOpen&&<div className="pt-4"><MemberAccess/></div>}</details></div>;}
