interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  pending: boolean;
}

/** Primary pill button with the design's spinner; disabled while pending (architecture §8). */
export function SubmitButton({ label, pendingLabel, pending }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1.5 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-bold text-white hover:bg-brand-strong disabled:cursor-progress disabled:opacity-80"
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white"
        />
      ) : null}
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
