import { Transform } from 'class-transformer';

/** Email: trimmed and lowercased before any check (architecture §4). Non-strings pass through to fail. */
export const NormalizeEmail = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/** Name: trimmed before any check. Passwords are never normalized. */
export const TrimString = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));
