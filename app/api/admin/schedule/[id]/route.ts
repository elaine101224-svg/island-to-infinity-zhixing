import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/requestId';
import { parseBody, scheduleEventUpsertSchema } from '@/lib/validation';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(data.data ?? data);
  } catch (error) {
    console.error('Error reading event:', error);
    return NextResponse.json({ error: 'Failed to read event' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutation(request);
  if (guard) return guard;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    let payload: unknown;
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 }); }
    const parsed = parseBody(scheduleEventUpsertSchema, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
    }

    const updatedRecord = {
      ...parsed.data,
      id,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('schedule')
      .update({ data: updatedRecord })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutation(request);
  if (guard) return guard;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('schedule').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
