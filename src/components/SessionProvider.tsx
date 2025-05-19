// src/components/SessionProvider.tsx
"use client"; // This directive MUST be the very first line

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
  session: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
