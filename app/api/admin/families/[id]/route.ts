import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json(data.data);
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

    const updatedFamily = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('families')
      .update({ data: updatedFamily })
      .eq('id', id);

    if (error) throw error;

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

    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}
