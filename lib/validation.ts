import { z } from 'zod';

/**
 * Single source of truth for admin-request shapes. Route handlers parse with
 * `parseBody()`; the resulting value is safe to cast to the matching TypeScript
 * type from `@/types`. Keeping validation centralised here means
 * the schema and the type stay in lock-step when one of them changes.
 */

// ───────────────────────── shared primitives ─────────────────────────

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
export const isoDateTime = z.string().datetime({ offset: true });
export const timeOfDay = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'expected HH:MM');

export const nonEmpty = (max: number) =>
  z.string().trim().min(1).max(max);

const photoSchema = z.object({
  url: z
    .string()
    .max(2_500_000)
    .refine(
      (v) => v.startsWith('data:image/') || /^https?:\/\//i.test(v),
      'photo url must be http(s) or data:image/'
    ),
  caption: z.string().max(500).default(''),
  consentGiven: z.boolean(),
});

const highlightSchema = z.object({
  date: isoDate,
  title: nonEmpty(200),
  description: nonEmpty(2000),
  photos: z
    .array(
      z
        .string()
        .max(2048)
        .refine((v) => /^https?:\/\//i.test(v), 'photo url must be http(s)')
    )
    .optional(),
});

// ───────────────────────── families ─────────────────────────

export const familySchema = z.object({
  pseudonym: nonEmpty(120),
  location: nonEmpty(200),
  familyComposition: z.object({
    adults: z.number().int().min(0).max(20),
    children: z.number().int().min(0).max(20),
    elderly: z.number().int().min(0).max(20),
  }),
  background: nonEmpty(5000),
  currentSituation: nonEmpty(5000),
  keyChallenges: z.array(nonEmpty(300)).max(50).default([]),
  highlights: z.array(highlightSchema).max(200).default([]),
  photos: z.array(photoSchema).max(50).default([]),
  consentGiven: z.boolean(),
});

export const familyUpsertSchema = familySchema;

// ───────────────────────── team members ─────────────────────────

export const teamMemberSchema = z.object({
  name: nonEmpty(120),
  role: z.enum(['lead', 'coordinator', 'volunteer']),
  email: z.string().email().max(254).or(z.literal('')).default(''),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[+\d\s()-]*$/, 'phone contains invalid characters')
    .or(z.literal(''))
    .default(''),
  status: z.enum(['active', 'inactive']),
  assignedFamilyIds: z.array(z.string().min(1)).max(200).default([]),
  joinedDate: isoDate,
  notes: z.string().max(2000).default(''),
});

export const teamMemberUpsertSchema = teamMemberSchema;

// ───────────────────────── support plans ─────────────────────────

const objectiveSchema = z.object({
  id: z.string().min(1).max(80),
  description: nonEmpty(500),
  successIndicator: nonEmpty(500),
  status: z.enum(['pending', 'in_progress', 'achieved']),
});

const plannedActivitySchema = z.object({
  id: z.string().min(1).max(80),
  title: nonEmpty(200),
  description: nonEmpty(2000),
  frequency: nonEmpty(100),
  status: z.enum(['planned', 'completed', 'cancelled']),
});

export const supportPlanSchema = z.object({
  familyIds: z.array(z.string().min(1)).min(1).max(50),
  title: nonEmpty(200),
  focusArea: z.enum(['social', 'financial', 'academic']),
  status: z.enum(['active', 'completed', 'on_hold']),
  startDate: isoDate,
  targetEndDate: isoDate.optional(),
  objectives: z.array(objectiveSchema).max(50).default([]),
  activities: z.array(plannedActivitySchema).max(50).default([]),
  ethicsDescription: nonEmpty(3000),
});

export const supportPlanUpsertSchema = supportPlanSchema;

// ───────────────────────── schedule ─────────────────────────

export const scheduleEventSchema = z.object({
  title: nonEmpty(200),
  type: z.enum(['field_trip', 'visit', 'event', 'meeting']),
  date: isoDate,
  startTime: timeOfDay,
  endTime: timeOfDay,
  location: nonEmpty(300),
  description: z.string().max(5000).default(''),
  familiesInvolved: z.array(z.string().min(1)).max(50).default([]),
  maxParticipants: z.number().int().min(1).max(10_000).optional(),
  isPublic: z.boolean(),
});

export const scheduleEventUpsertSchema = scheduleEventSchema;

// ───────────────────────── activity records ─────────────────────────

export const activityRecordSchema = z.object({
  eventId: z.string().min(1).max(120).optional(),
  title: nonEmpty(200),
  type: z.enum(['field_trip', 'visit', 'event', 'meeting']),
  date: isoDate,
  familyIds: z.array(z.string().min(1)).max(50).default([]),
  memberIds: z.array(z.string().min(1)).max(50).default([]),
  summary: z.string().max(10_000).default(''),
  outcomes: z.string().max(10_000).default(''),
  followUps: z.string().max(10_000).default(''),
  photos: z.array(photoSchema).max(50).default([]),
});

export const activityRecordUpsertSchema = activityRecordSchema;

// ───────────────────────── parsing helper ─────────────────────────

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues: string[] };

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  payload: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(payload);
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues.map(
    (i) => `${i.path.join('.') || '<root>'}: ${i.message}`
  );
  return { ok: false, error: 'Validation failed', issues };
}
