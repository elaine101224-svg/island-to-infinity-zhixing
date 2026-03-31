import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { validateSession } from '@/lib/auth';
import type { ScheduleData } from '@/types';

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
    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    const event = jsonData.events.find((e) => e.id === id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error reading event:', error);
    return NextResponse.json({ error: 'Failed to read event' }, { status: 500 });
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

    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    const eventIndex = jsonData.events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    jsonData.events[eventIndex] = {
      ...jsonData.events[eventIndex],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(jsonData.events[eventIndex]);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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
    const filePath = path.join(dataDir, 'schedule.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData: ScheduleData = JSON.parse(data);

    const eventIndex = jsonData.events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    jsonData.events.splice(eventIndex, 1);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
