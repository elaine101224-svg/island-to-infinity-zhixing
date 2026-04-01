import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*');

    if (error) throw error;

    const events = data.map((row: { id: string; data: unknown }) => row.data);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error reading schedule:', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newEvent = {
      id: `event-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('schedule')
      .insert({ id: newEvent.id, data: newEvent });

    if (error) throw error;

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
