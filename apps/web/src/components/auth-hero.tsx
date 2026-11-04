import { CheckIcon } from './check-icon';

/** Decorative hero panel with a miniature of the app screen (design reference, screen 01). */
export function AuthHero() {
  return (
    <aside className="relative flex min-h-[560px] flex-[1_1_480px] flex-col gap-7 overflow-hidden rounded-3xl bg-brand-deep px-11 pt-12 text-on-deep">
      <div className="flex max-w-[460px] flex-col gap-3">
        <span className="inline-flex h-[26px] items-center self-start rounded-full bg-accent px-[11px] text-[11.5px] font-extrabold tracking-[.04em] text-brand-deep">
          WORKSPACE
        </span>
        <h2 className="m-0 text-[34px] leading-[1.15] font-extrabold tracking-[-.02em] text-pretty">
          One account for everything your team works on.
        </h2>
        <p className="m-0 text-[15px] leading-[1.55] font-medium text-pretty text-on-deep-muted">
          Sign in once and pick up exactly where you left off, on any device.
        </p>
      </div>

      <div aria-hidden="true" className="relative -me-11 min-h-[340px] flex-1">
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-ss-[18px] bg-canvas text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,.45)]">
          <div className="flex items-center gap-3 border-b border-line-soft bg-surface px-[18px] py-3">
            <span className="flex gap-1.5">
              <span className="size-[9px] rounded-full bg-line" />
              <span className="size-[9px] rounded-full bg-line" />
              <span className="size-[9px] rounded-full bg-line" />
            </span>
            <span className="ms-2 flex items-center gap-[7px]">
              <span className="flex size-5 items-center justify-center rounded-[999px_999px_999px_3px] bg-brand text-[10px] font-extrabold text-accent">
                W
              </span>
              <span className="text-xs font-extrabold">Workspace</span>
            </span>
            <span className="ms-auto inline-flex h-6 items-center rounded-full bg-brand px-2.5 text-[10.5px] font-bold text-white">
              Log out
            </span>
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="flex w-[120px] flex-none flex-col gap-2.5 border-e border-line-soft bg-surface px-3.5 py-[18px]">
              <span className="h-[22px] rounded-[7px] bg-brand-tint" />
              <span className="h-2 w-[70%] rounded-full bg-line-soft" />
              <span className="h-2 w-[85%] rounded-full bg-line-soft" />
              <span className="h-2 w-[60%] rounded-full bg-line-soft" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3.5 p-[22px]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-muted">Hi, Dana</span>
                <span className="text-lg font-extrabold tracking-[-.01em]">
                  Welcome to the application.
                </span>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-line-soft bg-surface">
                <div className="flex items-center gap-2.5 bg-brand-deep px-3.5 py-3 text-on-deep">
                  <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-accent text-xs font-extrabold text-brand-deep">
                    DL
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12.5px] font-extrabold">Dana Levi</span>
                    <span className="text-[10.5px] text-on-deep-muted">dana@company.com</span>
                  </span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="flex flex-col gap-[3px] border-b border-line-faint px-3.5 py-2.5">
                    <span className="text-[9.5px] font-semibold text-ink-subtle">User ID</span>
                    <span className="text-[11px] font-bold">6650f1c2a9e4</span>
                  </span>
                  <span className="flex flex-col gap-[3px] border-b border-line-faint px-3.5 py-2.5">
                    <span className="text-[9.5px] font-semibold text-ink-subtle">Member since</span>
                    <span className="text-[11px] font-bold">Nov 4, 2026</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-9 -start-[22px] flex items-center gap-[9px] rounded-[14px] bg-ink px-3.5 py-2.5 text-on-deep shadow-[0_16px_36px_-12px_rgba(0,0,0,.55)]">
          <span className="flex size-[22px] items-center justify-center rounded-full bg-accent text-ink">
            <CheckIcon size={12} strokeWidth={3.2} />
          </span>
          <span className="text-xs font-bold">Signed in successfully</span>
        </div>
      </div>
    </aside>
  );
}
