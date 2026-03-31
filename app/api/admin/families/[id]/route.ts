import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { validateSession } from '@/lib/auth';
import type { FamiliesData } from '@/types';

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
    const filePath = path.join(dataDir, 'families.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: FamiliesData = JSON.parse(data);

    const family = jsonData.families.find((f) => f.id === id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json(family);
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
    const isLoggedIn = await validateSession();
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const filePath = path.join(dataDir, 'families.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: FamiliesData = JSON.parse(data);

    const familyIndex = jsonData.families.findIndex((f) => f.id === id);

    if (familyIndex === -1) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    jsonData.families[familyIndex] = {
      ...jsonData.families[familyIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(jsonData.families[familyIndex]);
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
    const isLoggedIn = await validateSession();
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const filePath = path.join(dataDir, 'families.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: FamiliesData = JSON.parse(data);

    const familyIndex = jsonData.families.findIndex((f) => f.id === id);

    if (familyIndex === -1) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    jsonData.families.splice(familyIndex, 1);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting family:', error);
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}
