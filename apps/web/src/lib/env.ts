import { z } from 'zod';

/**
 * Server-only web env (architecture §7). `API_URL` is the rewrite target and the origin for server-side session
 * fetches. Never exposed to the browser: no NEXT_PUBLIC_ prefix and not in next.config `env`.
 */
function isOrigin(value: string): boolean {
  try {
    return new URL(value).origin === value.replace(/\/$/, '');
  } catch {
    return false;
  }
}

const schema = z.object({
  API_URL: z
    .url({ protocol: /^https?$/ })
    // Zod 4 still runs refinements after the url check fails, so this must not throw (a TypeError would carry
    // the raw value into the build output).
    .refine(isOrigin, { message: 'must be an origin (no path, query or fragment)' })
    .transform((value) => value.replace(/\/$/, '')),
});

export type WebEnv = z.infer<typeof schema>;

/** Throws listing variable names only, never values, so `next build` and `next start` stop. */
export function parseWebEnv(raw: NodeJS.ProcessEnv): WebEnv {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))].sort();
    throw new Error(`Invalid web environment variables: ${names.join(', ')}`);
  }
  return result.data;
}
