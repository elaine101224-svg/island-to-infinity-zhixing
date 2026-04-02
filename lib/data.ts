import { supabase } from './supabase';
import type { Family, ScheduleEvent, SupportPlan } from '@/types';

export async function getFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*');

  if (error || !data) {
    console.error('Error fetching families:', error);
    return [];
  }

  return data.map((row: { id: string; data: Family }) => row.data);
}

export async function getFamilyById(id: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching family:', error);
    return null;
  }

  return data.data as Family;
}

export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  const { data, error } = await supabase
    .from('schedule')
    .select('*');

  if (error || !data) {
    console.error('Error fetching schedule:', error);
    return [];
  }

  return data.map((row: { id: string; data: ScheduleEvent }) => row.data);
}

export async function getPublicEvents(): Promise<ScheduleEvent[]> {
  const events = await getScheduleEvents();
  return events.filter(e => e.isPublic);
}

export async function getPlans(): Promise<SupportPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*');

  if (error || !data) {
    console.error('Error fetching plans:', error);
    return [];
  }

  return data.map((row: { id: string; data: SupportPlan }) => row.data);
}

export async function getPlanById(id: string): Promise<SupportPlan | null> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching plan:', error);
    return null;
  }

  return data.data as SupportPlan;
}

export async function getPlansByFamilyId(familyId: string): Promise<SupportPlan[]> {
  const plans = await getPlans();
  return plans.filter(p => p.familyId === familyId);
}
