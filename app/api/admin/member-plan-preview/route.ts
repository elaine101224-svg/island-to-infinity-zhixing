import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/apiGuard';
import { memberService, dbResult, privateHeaders } from '@/lib/members/auth';
import { memberPlanSchema } from '@/lib/member-plan/schema';
import { previewMemberPlan, type DirectoryPerson, type PlanAccount, type ExistingWorkspace } from '@/lib/member-plan/preview';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  // The request contains private planning material: all responses, including errors, are private.
  const guarded = await guardMutation(request, memberPlanSchema);
  if (!guarded.ok) {
    for (const [key, value] of Object.entries(privateHeaders)) guarded.response.headers.set(key, value);
    return guarded.response;
  }
  try {
    const db = memberService();
    const [directory, accounts, workspace] = await Promise.all([
      db.from('team_members').select('id,data'),
      db.from('member_accounts').select('user_id,person_id,name,state,role'),
      db.from('term_workspaces').select('revision,document').eq('id', '2026-27-T1').maybeSingle(),
    ]);
    const preview = previewMemberPlan(guarded.data, dbResult(directory) as DirectoryPerson[], dbResult(accounts) as PlanAccount[], dbResult(workspace) as ExistingWorkspace);
    return NextResponse.json(preview, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: 'Preview could not load current accounts and planning. No data was changed. Retry after storage is available.' }, { status: 503, headers: privateHeaders });
  }
}
