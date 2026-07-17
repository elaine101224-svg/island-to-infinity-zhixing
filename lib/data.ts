import { supabase } from '@/lib/supabase';
import type { ActivityRecord, Family, ScheduleEvent, SupportPlan, TeamMember } from '@/types';

/**
 * Server-side data accessors for the admin pages.
 *
 * Previous implementation routed every call through HTTP self-fetch
 * (`fetch('/api/admin/...')`), which cost one full request/response
 * cycle per resource on top of the Supabase round-trip. On a serverless
 * function that latency is multiplied by N parallel queries — and the
 *   page that awaits them — producing visible "stutter" right after the
 * admin login flow redirected here.
 *
 * These helpers now hit Supabase directly. Behaviour is unchanged from
 * the caller's perspective (same types, same shape, same filter rules).
 */

interface TableRow {
  id: string;
  data: Record<string, unknown>;
  updated_at?: string;
}

function unwrap<T>(rows: TableRow[] | null): T[] {
  if (!rows) return [];
  return rows.map((r) => r.data as unknown as T).filter(Boolean);
}

async function selectAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`[data] select ${table} failed:`, error.message);
    return [];
  }
  return unwrap<T>(data as TableRow[] | null);
}

async function selectOne<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error || !data) return null;
  return ((data as TableRow).data as unknown as T) ?? null;
}

// ---- Families ----

export async function getFamilies(): Promise<Family[]> {
  return selectAll<Family>('families');
}

export async function getFamilyById(id: string): Promise<Family | null> {
  if (!id) return null;
  return selectOne<Family>('families', id);
}

// ---- Plans ----

export async function getPlans(): Promise<SupportPlan[]> {
  return selectAll<SupportPlan>('plans');
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  if (!id) return null;
  return selectOne<SupportPlan>('plans', id);
}

export async function getPlansByFamilyId(familyId: string): Promise<SupportPlan[]> {
  if (!familyId) return [];
  const plans = await getPlans();
  return plans.filter((p) => Array.isArray(p.familyIds) && p.familyIds.includes(familyId));
}

// ---- Schedule ----

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  return selectAll<ScheduleEvent>('schedule');
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter((e) => e && e.isPublic);
}

// ---- Team ----

export async function getTeamMembers(): Promise<TeamMember[]> {
  return selectAll<TeamMember>('team');
}

// ---- Activity records ----

export async function getActivityRecords(): Promise<ActivityRecord[]> {
  return selectAll<ActivityRecord>('activity_records');
}
