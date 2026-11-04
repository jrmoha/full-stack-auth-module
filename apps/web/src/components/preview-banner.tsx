import Link from 'next/link';

/**
 * Visual preview only: these screens are not connected to the API yet. Removed when tasks 2.3 to 2.5
 * wire the pages to the session helper and the auth endpoints.
 */
export function PreviewBanner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2 text-center text-xs font-semibold text-on-deep">
      <span>Design preview: not connected to the API yet.</span>
      <nav aria-label="Preview pages" className="flex gap-3">
        <Link href="/signin" className="text-accent hover:text-accent">
          Sign in
        </Link>
        <Link href="/signup" className="text-accent hover:text-accent">
          Sign up
        </Link>
        <Link href="/app" className="text-accent hover:text-accent">
          App
        </Link>
      </nav>
    </div>
  );
}
