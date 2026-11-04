interface FormAlertProps {
  message: string;
}

/** Form-level alert from the design; a live region (architecture §8). */
export function FormAlert({ message }: FormAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-[10px] bg-danger-tint px-3 py-2.5 text-[13px] leading-[1.45] font-bold text-danger"
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="mt-px flex-none"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="7.5" x2="12" y2="13" />
        <line x1="12" y1="16.3" x2="12" y2="16.5" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
