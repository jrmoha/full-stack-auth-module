'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signin } from '@/lib/api-client';
import type { FormError } from '@/lib/errors';
import { type SigninInput, signinSchema, type SigninValues } from '@/lib/validation';
import { FormAlert } from './form-alert';
import { FormField } from './form-field';
import { PasswordField } from './password-field';
import { SubmitButton } from './submit-button';

const FIELDS = ['email', 'password'] as const;

/**
 * Signin form (architecture §8), built from the 2.4 components. Wrong credentials, unknown email and 429 all
 * land in the alert; field errors map onto fields. Success replaces history with /app.
 */
export function SigninForm() {
  const router = useRouter();
  const [failure, setFailure] = useState<Pick<FormError, 'alert' | 'reference'>>({});
  // Stays true until /app loads: isSubmitting ends when the handler returns, before navigation completes.
  const [navigating, setNavigating] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SigninInput, unknown, SigninValues>({
    resolver: zodResolver(signinSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFailure({});
    const result = await signin(values);
    if (result.ok) {
      setNavigating(true);
      router.replace('/app');
      return;
    }
    const { fieldErrors, alert, reference } = result.error;
    const first = FIELDS.find((field) => fieldErrors[field]);
    for (const field of FIELDS) {
      const message = fieldErrors[field];
      if (message) setError(field, { type: 'server', message }, { shouldFocus: field === first });
    }
    setFailure({ alert, reference });
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      {failure.alert ? (
        <FormAlert
          message={failure.reference ? `${failure.alert} ${failure.reference}` : failure.alert}
        />
      ) : null}
      <FormField
        id="signin-email"
        label="Email address"
        type="email"
        dir="ltr"
        autoComplete="email"
        placeholder="name@company.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        id="signin-password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />
      <SubmitButton
        label="Sign in"
        pendingLabel="Signing in…"
        pending={isSubmitting || navigating}
      />
    </form>
  );
}
