import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found · Workspace' };

// Server Component (architecture §8).
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="flex w-full max-w-[400px] flex-col items-start gap-4 rounded-[20px] border border-line-soft bg-surface p-8">
        <p className="m-0 text-sm font-semibold text-ink-muted">404</p>
        <h1 className="m-0 text-2xl font-extrabold tracking-[-.02em]">Page not found</h1>
        <p className="m-0 text-sm font-medium text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">Go to the start page</Link>
      </div>
    </main>
  );
}
