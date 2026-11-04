'use client';

// The one allowed non-leaf client component (architecture §8): Next.js requires error boundaries to be client
// components. Catches render errors, including the session helper throwing when the API is down.
interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string'
      ? error.digest
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div
        role="alert"
        className="flex w-full max-w-[400px] flex-col items-start gap-4 rounded-[20px] border border-line-soft bg-surface p-8"
      >
        <h1 className="m-0 text-2xl font-extrabold tracking-[-.02em]">Something went wrong</h1>
        <p className="m-0 text-sm font-medium text-ink-muted">
          We couldn&apos;t load this page. Check your connection and try again.
        </p>
        {digest ? <p className="m-0 text-xs text-ink-subtle">Reference: {digest}</p> : null}
        <button
          type="button"
          onClick={retry}
          className="flex h-12 cursor-pointer items-center justify-center rounded-full bg-brand px-6 text-[14.5px] font-bold text-white hover:bg-brand-strong"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
