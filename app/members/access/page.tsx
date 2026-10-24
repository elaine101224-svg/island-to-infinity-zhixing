import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberAccess from '@/components/members/MemberAccess';
export const dynamic='force-dynamic';
export default function Page(){return <><Navbar/><main className="flex-grow px-5 py-10"><MemberAccess/></main><Footer/></>;}
