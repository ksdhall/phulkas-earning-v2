"use client"; // This is a client component

import { NextIntlClientProvider } from 'next-intl'; // Import from 'next-intl'
import { usePathname } from 'next/navigation'; // Hook to get current pathname
import React, { ReactNode } from 'react';

interface NextIntlClientProviderWrapperProps {
  children: ReactNode;
  messages: Record<string, any>; // Re-added messages prop to interface
  timeZone: string; // Keep timeZone
}

export default function NextIntlClientProviderWrapper({ children, messages, timeZone }: NextIntlClientProviderWrapperProps) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en'; // Derive locale from pathname

  return (
    // CRITICAL: NextIntlClientProvider now receives both 'locale' and 'messages' (and 'timeZone').
    <NextIntlClientProvider messages={messages} locale={locale} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
