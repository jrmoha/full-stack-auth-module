import { defineConfig } from 'vitest/config';

// Web unit tests (Zod schemas, error mapping) run in node; the first ones land in task 2.1.
export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
