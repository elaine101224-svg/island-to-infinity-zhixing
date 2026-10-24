import {NextResponse} from 'next/server';
import {validateSession} from '@/lib/auth';
import {requireMember,privateHeaders} from '@/lib/members/auth';
import {requireRosterEditor,canEditRoster} from '@/lib/members/roster';
import {readDirectory} from '@/lib/members/directory';
export async function GET(){try{let editable=false;if(!await validateSession()){await requireRosterEditor();editable=true;}else{try{editable=canEditRoster((await requireMember()).account);}catch{/* Shared admin sessions can read, but cannot edit the directory. */}}return NextResponse.json({members:await readDirectory(),canEdit:editable},{headers:privateHeaders});}catch{return NextResponse.json({error:'Sign in with an authorized account.'},{status:401,headers:privateHeaders});}}
