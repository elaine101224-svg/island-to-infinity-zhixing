import { promises as fs } from 'fs';
import path from 'path';
import type { FamiliesData, ScheduleData, PlansData, Family, ScheduleEvent, SupportPlan } from '@/types';

const dataDir = path.join(process.cwd(), 'data');

export async function getFamilies(): Promise<Family[]> {
  const filePath = path.join(dataDir, 'families.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const jsonData: FamiliesData = JSON.parse(data);
  return jsonData.families;
}

export async function getFamilyById(id: string): Promise<Family | null> {
  const families = await getFamilies();
  return families.find(f => f.id === id) || null;
}

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  const filePath = path.join(dataDir, 'schedule.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const jsonData: ScheduleData = JSON.parse(data);
  return jsonData.events;
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter(e => e.isPublic);
}

export async function getPlans(): Promise<SupportPlan[]> {
  const filePath = path.join(dataDir, 'plans.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const jsonData: PlansData = JSON.parse(data);
  return jsonData.plans;
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  const plans = await getPlans();
  return plans.find(p => p.id === id) || null;
}

export async function getPlansByFamilyId(familyId: string): Promise<SupportPlan[]> {
  const plans = await getPlans();
  return plans.filter(p => p.familyId === familyId);
}
