"use client";

import { NextIntlClientProvider } from 'next-intl';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

interface NextIntlClientProviderWrapperProps {
  children: ReactNode;
  messages: Record<string, any>;
  timeZone: string;
}

export default function NextIntlClientProviderWrapper({ children, messages, timeZone }: NextIntlClientProviderWrapperProps) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone={timeZone}>
      {children} {/* This is where your app's content within the i18n context is rendered */}
    </NextIntlClientProvider>
  );
}
