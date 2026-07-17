import { vi } from 'vitest';

// Silence noisy console output from the modules under test.
const origLog = console.log;
const origError = console.error;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('{"t":')) return;
  origLog(...args);
};
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('{"t":')) return;
  origError(...args);
};

// Each file gets a fresh module registry so cached state (rate limit map,
// cookies mock) doesn't bleed across tests.
vi.resetModules();
