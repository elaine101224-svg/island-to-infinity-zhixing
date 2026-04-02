import type { Family, ScheduleEvent, SupportPlan } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || '';

async function fetchAPI<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchAPIOne<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

export async function getFamilies(): Promise<Family[]> {
  return (await fetchAPI<Family>('/api/admin/families')).filter(Boolean);
}

export async function getFamilyById(id: string): Promise<Family | null> {
  if (!id) return null;
  return await fetchAPIOne<Family>(`/api/admin/families/${id}`);
}

export async function getPlans(): Promise<SupportPlan[]> {
  return (await fetchAPI<SupportPlan>('/api/admin/plans')).filter(Boolean);
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  if (!id) return null;
  return await fetchAPIOne<SupportPlan>(`/api/admin/plans/${id}`);
}

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  return (await fetchAPI<ScheduleEvent>('/api/admin/schedule')).filter(Boolean);
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter(e => e && e.isPublic);
}