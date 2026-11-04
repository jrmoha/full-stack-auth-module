'use client';

import { useState, type SubmitEvent } from 'react';
import { FormAlert } from './form-alert';
import { FormField } from './form-field';
import { PasswordField } from './password-field';
import { PasswordRules } from './password-rules';
import { SubmitButton } from './submit-button';

/**
 * Visual preview of the signup form (design screen 01). Task 2.4 adds React Hook Form, the 2.1 Zod schema
 * and the API call; until then submitting only explains that it is not connected.
 */
export function SignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Preview only: creating an account is connected in task 2.4.');
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {notice ? <FormAlert message={notice} /> : null}
      <FormField
        id="signup-email"
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
      <FormField
        id="signup-name"
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Your full name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        placeholder="Create a password"
        hintId="signup-password-rules"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />
      <PasswordRules id="signup-password-rules" password={password} />
      <SubmitButton label="Create account" pendingLabel="Creating account…" pending={false} />
    </form>
  );
}
