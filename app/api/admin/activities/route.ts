import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/requestId';
import { parseBody, activityRecordUpsertSchema } from '@/lib/validation';

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
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const { data, error } = await supabase.from('activity_records').select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json([]);
    }

    const records = data.map((row) => row.data ?? row);
    const res = NextResponse.json(records);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Error reading activity records:', error);
    return NextResponse.json({ error: 'Failed to read activity records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardMutation(request);
  if (guard) return guard;

  try {
    let payload: unknown;
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 }); }
    const parsed = parseBody(activityRecordUpsertSchema, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
    }

    const newRecord = {
      id: `activitie-${Date.now()}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('activities')
      .insert({ id: newRecord.id, data: newRecord });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
      console.error('Error creating activitie:', error);
    return NextResponse.json({ error: 'Failed to create activitie' }, { status: 500 });
  }
}

async function requireAdminSession(): Promise<NextResponse | null> {
  if (!(await validateSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
