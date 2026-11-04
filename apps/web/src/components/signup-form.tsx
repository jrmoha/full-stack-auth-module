'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { signup } from '@/lib/api-client';
import type { FormError } from '@/lib/errors';
import { type SignupInput, signupSchema, type SignupValues } from '@/lib/validation';
import { FormAlert } from './form-alert';
import { FormField } from './form-field';
import { PasswordField } from './password-field';
import { PasswordRules } from './password-rules';
import { SubmitButton } from './submit-button';

const FIELDS = ['email', 'name', 'password'] as const;

/**
 * Signup form (architecture §8): validates on blur, then on change; the first §4 message per field; focus moves to
 * the first invalid field on submit; server field errors (400, 409) map onto fields; everything else goes to the
 * alert. Success replaces history with /app.
 */
export function SignupForm() {
  const router = useRouter();
  const [failure, setFailure] = useState<Pick<FormError, 'alert' | 'reference'>>({});
  // Stays true until /app loads: isSubmitting ends when the handler returns, before navigation completes.
  const [navigating, setNavigating] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput, unknown, SignupValues>({
    resolver: zodResolver(signupSchema),
    // §8 "validate on blur, then on change": onTouched validates a field on its first blur and on every change
    // after that (reValidateMode alone only applies after the first submit).
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', name: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    setFailure({});
    const result = await signup(values);
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
        id="signup-email"
        label="Email address"
        type="email"
        dir="ltr"
        autoComplete="email"
        placeholder="name@company.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        id="signup-name"
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        error={errors.name?.message}
        {...register('name')}
      />
      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        placeholder="Create a password"
        hintId="signup-password-rules"
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordRules id="signup-password-rules" password={password} />
      <SubmitButton
        label="Create account"
        pendingLabel="Creating account…"
        pending={isSubmitting || navigating}
      />
    </form>
  );
}
