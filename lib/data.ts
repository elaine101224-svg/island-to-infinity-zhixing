import type { Family, ScheduleEvent, SupportPlan } from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'http://localhost:3000';
console.log('API_BASE:', API_BASE);

async function fetchAPI<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Error fetching ${endpoint}: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Exception fetching ${endpoint}:`, error);
    return [];
  }
}

async function fetchAPIOne<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch (error) {
    console.error(`Exception fetching ${endpoint}:`, error);
    return null;
  }
}

// Families
export async function getFamilies(): Promise<Family[]> {
  const families = await fetchAPI<Family>('/api/admin/families');
  return families.filter(Boolean);
}

export async function getFamilyById(id: string): Promise<Family | null> {
  if (!id) return null;
  const family = await fetchAPIOne<Family>(`/api/admin/families/${id}`);
  return family;
}

// Plans
export async function getPlans(): Promise<SupportPlan[]> {
  const plans = await fetchAPI<SupportPlan>('/api/admin/plans');
  return plans.filter(Boolean);
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  if (!id) return null;
  const plan = await fetchAPIOne<SupportPlan>(`/api/admin/plans/${id}`);
  return plan;
}

// ✅ 新增 export，按家庭过滤计划
export async function getPlansByFamilyId(familyId: string): Promise<SupportPlan[]> {
  if (!familyId) return [];
  const plans = await getPlans();
  return plans.filter(p => p && p.familyId === familyId);
}

// Schedule
export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  const events = await fetchAPI<ScheduleEvent>('/api/admin/schedule');
  return events.filter(Boolean);
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter(e => e && e.isPublic);
}