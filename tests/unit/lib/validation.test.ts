import { describe, it, expect } from 'vitest';
import {
  parseBody,
  familySchema,
  teamMemberSchema,
  supportPlanSchema,
  scheduleEventSchema,
  activityRecordSchema,
} from '@/lib/validation';

function validFamily() {
  return {
    pseudonym: 'Kaiyan Family',
    location: 'Changshu',
    familyComposition: { adults: 2, children: 2, elderly: 0 },
    background: 'Background text',
    currentSituation: 'Current situation text',
    keyChallenges: ['rent'],
    highlights: [
      { date: '2024-01-15', title: 'first visit', description: 'met the family' },
    ],
    photos: [{ url: 'data:image/png;base64,iVBORw0KGgo=', caption: 'family', consentGiven: true }],
    consentGiven: true,
  };
}

describe('parseBody', () => {
  it('returns ok with parsed data for a valid family payload', () => {
    const result = parseBody(familySchema, validFamily());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pseudonym).toBe('Kaiyan Family');
      expect(result.data.familyComposition.adults).toBe(2);
    }
  });

  it('rejects a family with a missing required field', () => {
    const broken = validFamily() as Record<string, unknown>;
    delete broken['pseudonym'];
    const result = parseBody(familySchema, broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.startsWith('pseudonym'))).toBe(true);
    }
  });

  it('rejects a family with a malformed date', () => {
    const broken = validFamily();
    broken.highlights = [
      { date: '15/01/2024', title: 'first visit', description: 'met the family' },
    ];
    const result = parseBody(familySchema, broken);
    expect(result.ok).toBe(false);
  });

  it('rejects a family photo whose URL is not http(s) and not a data: URL', () => {
    const broken = validFamily();
    broken.photos = [{ url: 'javascript:alert(1)', caption: 'x', consentGiven: true }];
    const result = parseBody(familySchema, broken);
    expect(result.ok).toBe(false);
  });

  it('rejects a team member with an invalid role enum value', () => {
    const result = parseBody(teamMemberSchema, {
      name: 'Alice',
      role: 'admin',
      email: '',
      phone: '',
      status: 'active',
      assignedFamilyIds: [],
      joinedDate: '2024-01-01',
      notes: '',
    });
    expect(result.ok).toBe(false);
  });

  it('accepts a valid support plan', () => {
    const result = parseBody(supportPlanSchema, {
      familyIds: ['familie-1'],
      title: 'Tuition support',
      focusArea: 'academic',
      status: 'active',
      startDate: '2024-01-01',
      objectives: [],
      activities: [],
      ethicsDescription: 'No money exchanged directly.',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a support plan without familyIds', () => {
    const result = parseBody(supportPlanSchema, {
      familyIds: [],
      title: 'Tuition support',
      focusArea: 'academic',
      status: 'active',
      startDate: '2024-01-01',
      objectives: [],
      activities: [],
      ethicsDescription: '...',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a schedule event with malformed time', () => {
    const result = parseBody(scheduleEventSchema, {
      title: 'Visit',
      type: 'visit',
      date: '2024-01-01',
      startTime: '9am',
      endTime: '10am',
      location: 'home',
      description: '',
      familiesInvolved: [],
      isPublic: true,
    });
    expect(result.ok).toBe(false);
  });

  it('accepts a valid activity record', () => {
    const result = parseBody(activityRecordSchema, {
      title: 'Visit',
      type: 'visit',
      date: '2024-01-01',
      familyIds: [],
      memberIds: [],
      summary: '',
      outcomes: '',
      followUps: '',
      photos: [],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects completely unrelated payloads (e.g. a string)', () => {
    const result = parseBody(familySchema, 'not an object');
    expect(result.ok).toBe(false);
  });
});
