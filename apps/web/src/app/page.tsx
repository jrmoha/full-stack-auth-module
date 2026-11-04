import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

// Dynamic (reads cookies). Signed-in users go to /app, everyone else to /signin (architecture §5).
export default async function HomePage() {
  const user = await getSession();
  redirect(user ? '/app' : '/signin');
}
