interface BrandMarkProps {
  size?: 'sm' | 'md';
}

/** "W" mark plus wordmark (docs/design/README.md). */
export function BrandMark({ size = 'md' }: BrandMarkProps) {
  const mark = size === 'sm' ? 'size-[30px] text-sm' : 'size-8 text-[15px]';
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`brand-mark flex items-center justify-center bg-brand font-extrabold text-accent ${mark}`}
      >
        W
      </span>
      <span className="text-base font-extrabold tracking-tight">Workspace</span>
    </span>
  );
}
