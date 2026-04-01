import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { SupportPlan, PlansData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(dataDir, 'plans.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: PlansData = JSON.parse(data);

    return NextResponse.json(jsonData.plans);
  } catch (error) {
    console.error('Error reading plans:', error);
    return NextResponse.json({ error: 'Failed to read plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newPlan: SupportPlan = {
      id: `plan-${Date.now()}`,
      familyId: body.familyId || '',
      title: body.title || 'New Plan',
      focusArea: body.focusArea || 'companionship',
      status: body.status || 'active',
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      targetEndDate: body.targetEndDate,
      objectives: body.objectives || [],
      activities: body.activities || [],
      ethicsDescription: body.ethicsDescription || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(dataDir, 'plans.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: PlansData = JSON.parse(data);

    jsonData.plans.push(newPlan);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
