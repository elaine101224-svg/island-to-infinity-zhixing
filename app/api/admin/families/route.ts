import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Family, FamiliesData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(dataDir, 'families.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: FamiliesData = JSON.parse(data);

    return NextResponse.json(jsonData.families);
  } catch (error) {
    console.error('Error reading families:', error);
    return NextResponse.json({ error: 'Failed to read families' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate new ID
    const newFamily: Family = {
      id: `family-${Date.now()}`,
      pseudonym: body.pseudonym || 'New Family',
      location: body.location || 'Unknown',
      familyComposition: body.familyComposition || { adults: 0, children: 0, elderly: 0 },
      background: body.background || '',
      currentSituation: body.currentSituation || '',
      keyChallenges: body.keyChallenges || [],
      highlights: body.highlights || [],
      photos: body.photos || [],
      consentGiven: body.consentGiven || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(dataDir, 'families.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: FamiliesData = JSON.parse(data);

    jsonData.families.push(newFamily);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(newFamily, { status: 201 });
  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  }
}
