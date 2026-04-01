import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*');

    if (error) throw error;

    // Extract 'data' field from each row
    const families = data.map((row: { id: string; data: unknown }) => row.data);

    return NextResponse.json(families);
  } catch (error) {
    console.error('Error reading families:', error);
    return NextResponse.json({ error: 'Failed to read families' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newFamily = {
      id: `family-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('families')
      .insert({ id: newFamily.id, data: newFamily });

    if (error) throw error;

    return NextResponse.json(newFamily, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  }
}
