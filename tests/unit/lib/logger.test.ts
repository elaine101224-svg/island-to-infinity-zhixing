import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '@/lib/logger';

describe('logger', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('emits a single-line JSON record for each call', () => {
    log.info('hello', { route: '/x' });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const line = infoSpy.mock.calls[0]?.[0] as unknown as string;
    expect(typeof line).toBe('string');
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('hello');
    expect(parsed.route).toBe('/x');
    expect(typeof parsed.t).toBe('string');
  });

  it('routes warn and error to the right channel', () => {
    log.warn('w');
    log.error('e');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const warnLine = warnSpy.mock.calls[0]?.[0] as unknown as string;
    const errLine = errorSpy.mock.calls[0]?.[0] as unknown as string;
    expect((JSON.parse(warnLine) as { level: string }).level).toBe('warn');
    expect((JSON.parse(errLine) as { level: string }).level).toBe('error');
  });

  it('handles missing fields', () => {
    log.info('solo');
    const line = infoSpy.mock.calls[0]?.[0] as unknown as string;
    const parsed = JSON.parse(line) as { msg: string; t: string };
    expect(parsed.msg).toBe('solo');
    expect(parsed.t).toBeDefined();
  });
});
