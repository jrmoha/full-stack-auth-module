import type { NextConfig } from 'next';
import { parseWebEnv } from './src/lib/env';

// Runs on `next build` and `next start`, after .env* files load: a missing or invalid API_URL stops both.
// The rewrite target is baked into the build output, so changing API_URL needs a rebuild.
const { API_URL } = parseWebEnv(process.env);

// Architecture §10 web headers. A nonce-based CSP is deferred (docs/future-improvements.md).
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  // Stop `next dev` from writing an AGENTS.md into the app; CLAUDE.md and docs/ are the agent guidance.
  agentRules: false,
  // Cache Components stay disabled (architecture §6).
  // The browser only talks to this origin; /api/* is proxied to the API, whose paths have no /api prefix.
  rewrites() {
    return Promise.resolve([{ source: '/api/:path*', destination: `${API_URL}/:path*` }]);
  },
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
