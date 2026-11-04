import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { SigninForm } from '@/components/signin-form';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in · Workspace' };

// Server Component, dynamic: signed-in users go to /app (architecture §5).
export default async function SigninPage() {
  if (await getSession()) {
    redirect('/app');
  }
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
