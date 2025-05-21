"use client";

import { SessionProvider } from 'next-auth/react';
import React, { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => { // This is a NAMED export
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};
