'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api-client';

/**
 * Client leaf (architecture §3). Posts to /api/auth/logout, then replaces history with /signin so Back does not
 * return to /app (§6). Disabled while pending; on failure it stays and shows an error.
 */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const onClick = async () => {
    setPending(true);
    setFailed(false);
    // If the request fails the httpOnly cookie is still set, and /signin would send the user straight back to
    // /app; so stay here and say so instead of navigating.
    if (!(await logout())) {
      setPending(false);
      setFailed(true);
      return;
    }
    router.replace('/signin');
    router.refresh();
  };

  return (
    <span className="flex items-center gap-3">
      {failed ? (
        <span role="alert" className="text-xs font-semibold text-danger">
          Couldn&apos;t log out. Try again.
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-full bg-brand px-3.5 text-[12.5px] font-bold text-white hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-progress disabled:opacity-80"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>{pending ? 'Logging out…' : 'Log out'}</span>
      </button>
    </span>
  );
}
