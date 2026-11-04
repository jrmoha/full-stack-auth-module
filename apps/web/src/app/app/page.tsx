import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/brand-mark';
import { LogoutButton } from '@/components/logout-button';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Workspace' };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

// Server Component (design screen 02). Dynamic: the session check runs on every request and is never cached
// (architecture §5, §6). Anonymous users go to /signin.
export default async function AppPage() {
  const user = await getSession();
  if (!user) {
    redirect('/signin');
  }
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const details = [
    { label: 'Full name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'User ID', value: user.id },
    { label: 'Member since', value: memberSince },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft bg-surface px-7 py-3.5">
        <BrandMark size="sm" />
        <LogoutButton />
      </header>

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-6 px-5 py-12">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-semibold text-ink-muted">Hi, {user.name.split(' ')[0]}</p>
          <h1 className="m-0 text-[32px] leading-[1.2] font-extrabold tracking-[-.02em] text-pretty">
            Welcome to the application.
          </h1>
        </div>

        <section
          aria-label="Your account"
          className="overflow-hidden rounded-[20px] border border-line-soft bg-surface"
        >
          <div className="flex items-center gap-4 bg-brand-deep px-6 py-[22px] text-on-deep">
            <span
              aria-hidden="true"
              className="flex size-14 flex-none items-center justify-center rounded-full bg-accent text-lg font-extrabold text-brand-deep"
            >
              {initials(user.name)}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="text-lg font-extrabold wrap-anywhere">{user.name}</span>
              <span className="text-[13px] font-medium wrap-anywhere text-on-deep-muted">
                {user.email}
              </span>
            </div>
            <span className="ms-auto inline-flex h-[26px] flex-none items-center gap-1.5 rounded-full bg-on-deep/12 px-2.5 text-[11.5px] font-bold">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
              Signed in
            </span>
          </div>
          <dl className="m-0 grid grid-cols-1 sm:grid-cols-2">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex flex-col gap-[5px] border-b border-line-faint px-6 py-4"
              >
                <dt className="text-xs font-semibold text-ink-subtle">{detail.label}</dt>
                <dd className="m-0 text-sm font-bold wrap-anywhere tabular-nums">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
