import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth-shell';
import { SigninForm } from '@/components/signin-form';

export const metadata: Metadata = { title: 'Sign in · Workspace' };

// Server Component. Task 2.5 adds the session check that redirects signed-in users to /app (architecture §5).
export default function SigninPage() {
  return (
    <AuthShell
      mode="signin"
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      switchPrompt="New here?"
      switchLabel="Create an account"
      switchHref="/signup"
    >
      <SigninForm />
    </AuthShell>
  );
}
