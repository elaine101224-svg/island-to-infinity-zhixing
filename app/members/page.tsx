import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberDashboard from '@/components/members/MemberDashboard';
export const dynamic='force-dynamic';
export default function Page(){return <><Navbar/><main className="flex-grow px-5 py-10"><MemberDashboard/></main><Footer/></>;}
