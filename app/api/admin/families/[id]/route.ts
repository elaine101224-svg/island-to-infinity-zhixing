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
      .from('families')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json(data.data ?? data);
  } catch (error) {
    console.error('Error reading family:', error);
    return NextResponse.json({ error: 'Failed to read family' }, { status: 500 });
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

    const updatedFamily = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('families')
      .update({ data: updatedFamily })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedFamily);
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json({ error: 'Failed to update family' }, { status: 500 });
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
      .from('families')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}
