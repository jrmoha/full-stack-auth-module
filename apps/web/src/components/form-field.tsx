import type { ComponentPropsWithRef } from 'react';
import { inputClass } from './field-styles';

interface FormFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'id' | 'className'> {
  id: string;
  label: string;
  error?: string | undefined;
}

/** Visible label, input and an error linked to it and announced (architecture §8). */
export function FormField({ id, label, error, ...input }: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass(Boolean(error))}
        {...input}
      />
      {error ? (
        <span id={errorId} aria-live="polite" className="text-xs font-semibold text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
