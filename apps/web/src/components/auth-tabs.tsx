import Link from 'next/link';

interface AuthTabsProps {
  active: 'signin' | 'signup';
}

const tab =
  'flex h-9 items-center justify-center rounded-full text-[13px] font-bold no-underline hover:no-underline';
const activeTab = `${tab} bg-surface text-ink shadow-[0_2px_8px_-3px_rgba(20,33,29,.25)] hover:text-ink`;
const idleTab = `${tab} text-ink-muted hover:text-ink`;

/** Segmented control from the design, as links between the two routes (architecture §5). */
export function AuthTabs({ active }: AuthTabsProps) {
  return (
    <nav aria-label="Account" className="grid grid-cols-2 gap-1 rounded-full bg-line-faint p-1">
      <Link
        href="/signin"
        aria-current={active === 'signin' ? 'page' : undefined}
        className={active === 'signin' ? activeTab : idleTab}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        aria-current={active === 'signup' ? 'page' : undefined}
        className={active === 'signup' ? activeTab : idleTab}
      >
        Sign up
      </Link>
    </nav>
  );
}
