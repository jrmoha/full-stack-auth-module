import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthHero } from './auth-hero';
import { AuthTabs } from './auth-tabs';
import { BrandMark } from './brand-mark';
import { PreviewBanner } from './preview-banner';

interface AuthShellProps {
  mode: 'signin' | 'signup';
  title: string;
  subtitle: string;
  switchPrompt: string;
  switchLabel: string;
  switchHref: '/signin' | '/signup';
  children: ReactNode;
}

/** Split auth layout from the design (screen 01): form column and decorative hero panel. */
export function AuthShell(props: AuthShellProps) {
  return (
    <>
      <PreviewBanner />
      <div className="flex min-h-screen flex-wrap gap-4 bg-surface p-4">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col px-4 pt-3 pb-6">
          <header>
            <BrandMark />
          </header>
          <main className="flex flex-1 items-center justify-center py-10">
            <div className="flex w-full max-w-[400px] flex-col gap-4">
              <div className="mb-1 flex flex-col gap-1.5">
                <h1 className="m-0 text-[28px] leading-[1.2] font-extrabold tracking-[-.02em]">
                  {props.title}
                </h1>
                <p className="m-0 text-sm leading-normal font-medium text-ink-muted">
                  {props.subtitle}
                </p>
              </div>
              <AuthTabs active={props.mode} />
              {props.children}
              <p className="mt-1.5 border-t border-line-soft pt-4 text-center text-[13px] font-medium text-ink-muted">
                {props.switchPrompt} <Link href={props.switchHref}>{props.switchLabel}</Link>
              </p>
            </div>
          </main>
        </div>
        <AuthHero />
      </div>
    </>
  );
}
