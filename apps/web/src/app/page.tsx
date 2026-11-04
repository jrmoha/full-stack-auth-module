import { redirect } from 'next/navigation';

// Preview: always the signin screen. Task 2.2 checks the session and sends signed-in users to /app (architecture §5).
export default function HomePage() {
  redirect('/signin');
}
