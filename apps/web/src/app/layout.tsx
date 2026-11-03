import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auth Module',
  description: 'Full-stack authentication module',
  // Empty icon until a real one exists, so browsers don't request a missing /favicon.ico.
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
