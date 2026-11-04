'use client';

import { useRouter } from 'next/navigation';

/** Client leaf (architecture §3). Preview: navigates to /signin; task 2.3 adds POST /api/auth/logout. */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        router.push('/signin');
      }}
      className="inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-full bg-brand px-3.5 text-[12.5px] font-bold text-white hover:bg-brand-strong"
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
      <span>Log out</span>
    </button>
  );
}
