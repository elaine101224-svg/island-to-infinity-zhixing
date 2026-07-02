import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateSession } from '@/lib/auth';

export async function GET() {
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
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error reading activity records:', error);
    return NextResponse.json({ error: 'Failed to read activity records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await validateSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const newRecord = {
      id: `activity-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('activity_records')
      .insert({ id: newRecord.id, data: newRecord });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating activity record:', error);
    return NextResponse.json({ error: 'Failed to create activity record' }, { status: 500 });
  }
}
