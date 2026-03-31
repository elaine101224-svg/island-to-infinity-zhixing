import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { ScheduleEvent, ScheduleData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    // Return only public events
    const publicEvents = jsonData.events.filter((event: ScheduleEvent) => event.isPublic);

    return NextResponse.json(publicEvents);
  } catch (error) {
    console.error('Error reading schedule:', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}
