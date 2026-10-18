import { describe, expect, it } from 'vitest';
import { eventTimeLabel } from '@/lib/calendar';
import { publicCardSchema, emptyPhoto } from '@/lib/contentSchema';

describe('public calendar time handling', () => {
  it('distinguishes unknown and partial times without an empty range', () => {
    expect(eventTimeLabel({})).toBe('Time to be confirmed');
    expect(eventTimeLabel({startTime:'19:00',endTime:'20:00'})).toBe('19:00–20:00 (China time)');
    expect(eventTimeLabel({startTime:'19:00'})).toContain('end time to be confirmed');
    expect(eventTimeLabel({endTime:'20:00'})).toContain('start time to be confirmed');
  });
  it('keeps existing content valid and rejects invalid public clock times', () => {
    const card={id:'a',kind:'event',title:'Session',photo:emptyPhoto};
    expect(publicCardSchema.safeParse(card).success).toBe(true);
    expect(publicCardSchema.safeParse({...card,startTime:'25:00'}).success).toBe(false);
    expect(publicCardSchema.safeParse({...card,endTime:'19:60'}).success).toBe(false);
  });
});
