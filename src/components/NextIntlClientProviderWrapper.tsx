"use client";

import { NextIntlClientProvider } from 'next-intl';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

interface NextIntlClientProviderWrapperProps {
  children: ReactNode;
  // We will pass messages from the server to this wrapper
  messages: Record<string, any>; // Use 'any' for messages as the structure can vary
}

export default function NextIntlClientProviderWrapper({ children, messages }: NextIntlClientProviderWrapperProps) {
  // Get the current locale from the URL pathname.
  // The pathname will be something like "/en/dashboard" or "/ja/summary".
  const pathname = usePathname();
  // Extract locale from the first segment, default to 'en' if not found
  const locale = pathname.split('/')[1] || 'en';

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
