import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*');

    if (error) throw error;

    const plans = data.map((row: { id: string; data: unknown }) => row.data);

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error reading plans:', error);
    return NextResponse.json({ error: 'Failed to read plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newPlan = {
      id: `plan-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('plans')
      .insert({ id: newPlan.id, data: newPlan });

    if (error) throw error;

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
