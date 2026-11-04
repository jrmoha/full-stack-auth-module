import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { SignupForm } from '@/components/signup-form';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign up · Workspace' };

// Server Component, dynamic: signed-in users go to /app (architecture §5).
export default async function SignupPage() {
  if (await getSession()) {
    redirect('/app');
  }
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
