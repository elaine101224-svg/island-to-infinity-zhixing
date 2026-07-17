import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/api/**/*.ts', 'lib/**/*.ts'],
      exclude: ['lib/supabase.ts', 'lib/anthropic.ts'],
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname) } },
});
