'use client';

import { useState, type SubmitEvent } from 'react';
import { FormAlert } from './form-alert';
import { FormField } from './form-field';
import { PasswordField } from './password-field';
import { SubmitButton } from './submit-button';

/**
 * Visual preview of the signin form (design screen 01). Task 2.5 adds React Hook Form, the 2.1 Zod schema
 * and the API call; until then submitting only explains that it is not connected.
 */
export function SigninForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Preview only: signing in is connected in task 2.5.');
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {notice ? <FormAlert message={notice} /> : null}
      <FormField
        id="signin-email"
        label="Email address"
        type="email"
        dir="ltr"
        autoComplete="email"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />
      <PasswordField
        id="signin-password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <SubmitButton label="Sign in" pendingLabel="Signing in…" pending={false} />
    </form>
  );
}
