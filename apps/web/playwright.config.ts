import { defineConfig, devices } from '@playwright/test';
import { resolveTestDatabaseUri } from './e2e/test-db';

/**
 * E2E against production builds of both apps on their own ports (dev keeps 3000/4000), API on the test database
 * (architecture §9). The guard runs when this file loads, so a wrong database aborts before any server starts.
 */
const TEST_MONGODB_URI = resolveTestDatabaseUri();

export const API_PORT = 4200;
export const WEB_PORT = 3200;
const WEB_ORIGIN = `http://localhost:${String(WEB_PORT)}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: WEB_ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Built by the root `pnpm e2e` script (nest build).
      command: 'node ../api/dist/main.js',
      url: `http://localhost:${String(API_PORT)}/auth/me`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        MONGODB_URI: TEST_MONGODB_URI,
        // Non-secret, e2e-only value (≥32 characters, not the §7 placeholder).
        JWT_SECRET: 'e2e-only-jwt-secret-not-used-anywhere-else-0123456789abcdef',
        WEB_ORIGIN,
        COOKIE_SECURE: 'false',
        // Every e2e request comes from one address; the limiter itself is covered by the API suite (1.8).
        THROTTLE_AUTH_LIMIT: '10000',
        // Pinned so a developer's apps/api/.env (also read by the API) cannot change e2e behaviour.
        THROTTLE_AUTH_TTL_SECONDS: '60',
        TRUST_PROXY_HOPS: '1',
        JWT_TTL_SECONDS: '3600',
        LOG_LEVEL: 'warn',
      },
    },
    {
      // Built by `pnpm --filter web e2e:build` into .next-e2e with API_URL pointing at the e2e API.
      command: `pnpm exec next start --port ${String(WEB_PORT)}`,
      url: `${WEB_ORIGIN}/signin`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'production',
        NEXT_DIST_DIR: '.next-e2e',
        API_URL: `http://localhost:${String(API_PORT)}`,
      },
    },
  ],
});
