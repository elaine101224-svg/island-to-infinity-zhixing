import SewingApp from "@/components/sewing/SewingApp";
import {redirect} from 'next/navigation';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;if(path[0]==='preview')redirect('/sewing/products');return <SewingApp/>;}
