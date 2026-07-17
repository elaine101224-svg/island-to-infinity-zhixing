import { describe, it, expect } from 'vitest';
import { AINotConfiguredError, AIUpstreamError } from '@/lib/anthropic';

describe('anthropic error classes', () => {
  it('AINotConfiguredError is a real Error with the right name', () => {
    const err = new AINotConfiguredError('no key');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('no key');
  });

  it('AIUpstreamError carries a status code', () => {
    const err = new AIUpstreamError('upstream', 503);
    expect(err.status).toBe(503);
    expect(err.message).toBe('upstream');
  });
});
