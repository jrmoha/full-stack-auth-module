import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SWC emits decorator metadata from tsconfig (architecture §2). It also turns Vite's own TS
  // transform off, whose metadata support is only partial (falls back to Object for some types).
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    globalSetup: ['test/setup/global-setup.ts'],
    setupFiles: ['test/setup/worker-guard.ts'],
    // Test files share one database, so they run one at a time (architecture §9).
    fileParallelism: false,
    // Above the 5 s Mongo server-selection timeout, so a stopped database reports as a connection error.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    env: {
      NODE_ENV: 'test',
      // Non-secret, test-only value (≥32 characters, not the §7 placeholder).
      JWT_SECRET: 'test-only-jwt-secret-not-used-outside-vitest-0123456789abcdef',
      WEB_ORIGIN: 'http://localhost:3000',
    },
  },
});
