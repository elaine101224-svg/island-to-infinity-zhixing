import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ScheduleEvent } from '@/types';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json([]);
    }

    const events: ScheduleEvent[] = [];

    for (const row of data) {
      if (row && typeof row === 'object' && 'data' in row) {
        const event = row.data as ScheduleEvent;
        if (event && typeof event === 'object' && event.isPublic === true) {
          events.push(event);
        }
      }
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error reading schedule:', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}
