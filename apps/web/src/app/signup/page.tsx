import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth-shell';
import { SignupForm } from '@/components/signup-form';

export const metadata: Metadata = { title: 'Sign up · Workspace' };

// Server Component. Task 2.4 adds the session check that redirects signed-in users to /app (architecture §5).
export default function SignupPage() {
  return (
    <AuthShell
      mode="signup"
      title="Create your account"
      subtitle="Sign up with your email to get started."
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      switchHref="/signin"
    >
      <SignupForm />
    </AuthShell>
  );
}
