import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const updatedEvent = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('schedule')
      .update({ data: updatedEvent })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
