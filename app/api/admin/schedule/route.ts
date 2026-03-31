import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { ScheduleEvent, ScheduleData } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function GET() {
  try {
    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    return NextResponse.json(jsonData.events);
  } catch (error) {
    console.error('Error reading schedule:', error);
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newEvent: ScheduleEvent = {
      id: `event-${Date.now()}`,
      title: body.title || 'New Event',
      type: body.type || 'event',
      date: body.date || new Date().toISOString().split('T')[0],
      startTime: body.startTime || '10:00',
      endTime: body.endTime || '11:00',
      location: body.location || 'TBD',
      description: body.description || '',
      familiesInvolved: body.familiesInvolved || [],
      maxParticipants: body.maxParticipants,
      isPublic: body.isPublic ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    jsonData.events.push(newEvent);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
