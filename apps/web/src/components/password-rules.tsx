import { CheckIcon } from './check-icon';

interface PasswordRulesProps {
  id: string;
  password: string;
}

/**
 * Live hint under the signup password (architecture §8). The checks follow the §4 rules: a letter is
 * A-Z or a-z, a special character is anything that is not an ASCII letter, a digit or whitespace.
 * Error messages still come from the §4 table, not from these labels.
 */
const RULES: readonly { label: string; test: (p: string) => boolean }[] = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'One letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export function PasswordRules({ id, password }: PasswordRulesProps) {
  return (
    <ul
      id={id}

      className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-2 p-0"
    >
      {RULES.map(({ label, test }) => {
        const ok = test(password);
        return (
          <li key={label} className="flex items-center gap-2 text-xs leading-[1.3] font-semibold">
            {ok ? (
              <span className="flex size-4 flex-none items-center justify-center rounded-full bg-brand text-white">
                <CheckIcon size={9} strokeWidth={3.6} />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="size-4 flex-none rounded-full border-[1.5px] border-rule-off"
              />
            )}
            <span className={ok ? 'text-brand-strong' : 'text-ink-muted'}>
              {label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
