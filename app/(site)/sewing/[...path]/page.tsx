import SewingApp from '@/components/sewing/SewingApp';
import {notFound} from 'next/navigation';
export const metadata={title:'Customization request form · Changshu Sewing Team',description:'Tell the sewing team what you would like to customise. Share your budget, design and files, then track your request with a private link.'};
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;if(path.length!==1||path[0]!=='request')notFound();return <SewingApp/>;}
