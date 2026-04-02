import type { Family, ScheduleEvent, SupportPlan } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || '';

async function fetchAPI<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Error fetching ${endpoint}:`, res.statusText);
    return [];
  }
  return res.json();
}

async function fetchAPIOne<T>(endpoint: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error(`Error fetching ${endpoint}:`, res.statusText);
    return null;
  }
  return res.json();
}

export async function getFamilies(): Promise<Family[]> {
  return fetchAPI<Family>('/api/admin/families');
}

export async function getFamilyById(id: string): Promise<Family | null> {
  return fetchAPIOne<Family>(`/api/admin/families/${id}`);
}

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  return fetchAPI<ScheduleEvent>('/api/admin/schedule');
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter(e => e.isPublic);
}

export async function getPlans(): Promise<SupportPlan[]> {
  return fetchAPI<SupportPlan>('/api/admin/plans');
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  return fetchAPIOne<SupportPlan>(`/api/admin/plans/${id}`);
}

export async function getPlansByFamilyId(familyId: string): Promise<SupportPlan[]> {
  const plans = await getPlans();
  return plans.filter(p => p.familyId === familyId);
}
