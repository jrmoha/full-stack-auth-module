'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { inputClass } from './field-styles';

interface PasswordFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'type'
> {
  id: string;
  label: string;
  error?: string | undefined;
  hintId?: string | undefined;
}

/** Password input with the design's show/hide toggle. */
export function PasswordField({ id, label, error, hintId, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : undefined, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-[7px]">
      <label htmlFor={id} className="text-[13px] font-bold">
        {label}
      </label>
      <span className="relative flex">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass(Boolean(error), true)}
          {...input}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
          }}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute end-1.5 top-1/2 h-8 -translate-y-1/2 cursor-pointer rounded-lg px-2.5 text-xs font-bold text-brand hover:bg-brand-tint"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
      {error ? (
        <span id={errorId} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
