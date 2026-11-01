import SewingApp from '@/components/sewing/SewingApp';
import {notFound} from 'next/navigation';
export const metadata={title:'定制需求表 · 爱心缝纫队'};
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;if(path.length!==1||path[0]!=='request')notFound();return <SewingApp/>;}
