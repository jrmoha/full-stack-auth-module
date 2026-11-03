import type { NextConfig } from 'next';

// Rewrites, security headers and env validation arrive in task 0.4.
// Cache Components stay disabled (architecture §6).
const nextConfig: NextConfig = {
  // Stop `next dev` from writing an AGENTS.md into the app; CLAUDE.md and docs/ are the agent guidance.
  agentRules: false,
};

export default nextConfig;
