import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/requestId';
import { parseBody, supportPlanUpsertSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function guardMutation(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!(await validateSession())) {
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
  }
  const csrf = await verifyCsrf(request);
  if (csrf) {
    return NextResponse.json({ error: csrf, requestId }, { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json([]);
    }

    const plans = data.map((row) => (row.data ?? row));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error reading plans:', error);
    return NextResponse.json({ error: 'Failed to read plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardMutation(request);
  if (guard) return guard;

  try {
    let payload: unknown;
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 }); }
    const parsed = parseBody(supportPlanUpsertSchema, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
    }

    const newRecord = {
      id: `plan-${Date.now()}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('plans')
      .insert({ id: newRecord.id, data: newRecord });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
