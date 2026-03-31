import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { validateSession } from '@/lib/auth';
import type { PlansData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isLoggedIn = await validateSession();
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const filePath = path.join(dataDir, 'plans.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: PlansData = JSON.parse(data);

    const plan = jsonData.plans.find((p) => p.id === id);

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error reading plan:', error);
    return NextResponse.json({ error: 'Failed to read plan' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isLoggedIn = await validateSession();
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const filePath = path.join(dataDir, 'plans.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: PlansData = JSON.parse(data);

    const planIndex = jsonData.plans.findIndex((p) => p.id === id);

    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    jsonData.plans[planIndex] = {
      ...jsonData.plans[planIndex],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(jsonData.plans[planIndex]);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isLoggedIn = await validateSession();
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const filePath = path.join(dataDir, 'plans.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: PlansData = JSON.parse(data);

    const planIndex = jsonData.plans.findIndex((p) => p.id === id);

    if (planIndex === -1) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    jsonData.plans.splice(planIndex, 1);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
