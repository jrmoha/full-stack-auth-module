import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Self-hosted at build time by next/font; no runtime request to Google (docs/design/README.md).
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Workspace',
  description: 'Full-stack authentication module',
  // Empty icon until a real one exists, so browsers don't request a missing /favicon.ico.
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
