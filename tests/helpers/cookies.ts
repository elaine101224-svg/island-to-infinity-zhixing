import { vi } from 'vitest';

/**
 * Build a `next/headers` cookies() double that records every set/delete call.
 * Pass it to `vi.mock('next/headers')` from a test file.
 */
export function makeCookieStore(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    get: vi.fn((name: string) =>
      Object.prototype.hasOwnProperty.call(store, name)
        ? { name, value: store[name] }
        : undefined
    ),
    set: vi.fn((name: string, value: string) => {
      store[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete store[name];
    }),
    _store: store,
  };
}
