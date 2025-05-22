// src/components/NextIntlClientProviderWrapper.tsx
"use client";

import { NextIntlClientProvider } from "next-intl";
import { AbstractIntlMessages } from "next-intl";

interface NextIntlClientProviderWrapperProps {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  timeZone: string;
  locale: string; // CRITICAL FIX: Add locale to props
}

const NextIntlClientProviderWrapper: React.FC<NextIntlClientProviderWrapperProps> = ({
  children,
  messages,
  timeZone,
  locale, // CRITICAL FIX: Destructure locale
}) => {
  return (
    // CRITICAL FIX: Pass locale to NextIntlClientProvider
    <NextIntlClientProvider messages={messages} timeZone={timeZone} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
};

export default NextIntlClientProviderWrapper;
