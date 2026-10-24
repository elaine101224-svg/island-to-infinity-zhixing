import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberRoster from '@/components/members/MemberRoster';
export default function Page() { return <><Navbar/><main className="flex-grow px-5 py-10"><MemberRoster/></main><Footer/></>; }
