import {NextResponse} from 'next/server';
import {validateSession} from '@/lib/auth';
import {privateHeaders} from '@/lib/members/auth';
import {requireRosterEditor} from '@/lib/members/roster';
import {readDirectoryState} from '@/lib/members/directory';
export async function GET(){try{if(!await validateSession())await requireRosterEditor();return NextResponse.json({...await readDirectoryState(),canEdit:true},{headers:privateHeaders});}catch{return NextResponse.json({error:'Sign in with an authorized account.'},{status:401,headers:privateHeaders});}}
