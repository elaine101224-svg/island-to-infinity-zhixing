import {requireMember} from '@/lib/members/auth';
import {canEditRoster} from '@/lib/members/roster';
import WorkspaceShell from './WorkspaceShell';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
export default async function MemberPageFrame({children}:{children:React.ReactNode}){let access:{canEditRoster:boolean;canManage:boolean}|null=null;try{const{account}=await requireMember();access={canEditRoster:canEditRoster(account),canManage:account.role==='admin'};}catch{/* Private APIs still enforce authorization; the page supplies a sign-in link. */}return access?<WorkspaceShell {...access}>{children}</WorkspaceShell>:<><Navbar/><main className="flex-grow px-5 py-10">{children}</main><Footer/></>;}
