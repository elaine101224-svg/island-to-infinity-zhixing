'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {LanguageProvider,api,Pending,ErrorMessage} from './shared';
import {defaultContent,type Content} from '@/lib/sewing/types';
import './sewing.css';
const RequestForm=dynamic(()=>import('./RequestForm'),{loading:()=> <p role="status" lang="en">Loading request form…</p>});
const RequestsInbox=dynamic(()=>import('./RequestsInbox'),{loading:()=> <Pending/>});
const ContentEditor=dynamic(()=>import('./ContentEditor'),{loading:()=> <Pending/>});
function AdminSewing(){const [content,setContent]=useState<Content>(defaultContent),[editor,setEditor]=useState(false),[error,setError]=useState('');useEffect(()=>{void api('content').then(r=>setContent(r.content)).catch(e=>setError(e.message));},[]);return <><div className="sw-row"><Link href="/sewing/manage">商家管理</Link><button onClick={()=>setEditor(false)}>需求列表</button><button onClick={()=>setEditor(true)}>内容存档</button></div><ErrorMessage code={error}/>{editor?<ContentEditor initial={content}/>:<RequestsInbox/>}</>;}
export default function SewingApp({admin=false}:{admin?:boolean}){return <LanguageProvider minimal><div className="sewing-desk-content"><header className="sewing-desk-header"><Link href="/sewing/request">{admin?'常熟爱心缝纫队':'Changshu Sewing Team'}</Link><nav aria-label={admin?'缝纫队导航':'Sewing navigation'}><Link href="/sewing/request">{admin?'提交需求':'Submit request'}</Link><Link href="/sewing/manage">{admin?'商家管理':'Merchant management'}</Link></nav></header>{admin?<AdminSewing/>:<RequestForm/>}<footer className="sw-footer">{admin?'常熟爱心缝纫队 × Island to Infinity · 联系方式及附件仅用于跟进本单。':'Changshu Sewing Team × Island to Infinity · Contact details and files are used only to follow up on your order.'}</footer></div></LanguageProvider>;}
