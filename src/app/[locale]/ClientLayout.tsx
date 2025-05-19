// src/app/[locale]/ClientLayout.tsx
"use client"; // This directive MUST be the very first line

import { ReactNode } from 'react';
import { Session } from 'next-auth';
// Import our local client-side SessionProvider wrapper
import { SessionProvider } from '@/components/SessionProvider';

interface ClientLayoutProps {
  children: ReactNode;
  session: Session | null;
}

export default function ClientLayout({ children, session }: ClientLayoutProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
