// src/app/layout.tsx

import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import getRequestConfig from '@/i18n/request';
import { getLocale } from 'next-intl/server';
import { AuthProvider } from '@/components/AuthProvider';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import MuiRegistry from '@/components/MuiRegistry';
import NextIntlClientProviderWrapper from '@/components/NextIntlClientProviderWrapper';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Earning App",
  description: "Track daily earnings",
};

export default async function RootLayout({
  children,
  params: { locale: rootLocaleParam },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  const currentRequestLocale = rootLocaleParam || await getLocale();
  const { locale, messages, timeZone } = await getRequestConfig({ requestLocale: currentRequestLocale });

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <MuiRegistry>
            <ThemeProviderWrapper>
              {/* CRITICAL FIX: Pass the locale prop here */}
              <NextIntlClientProviderWrapper messages={messages} timeZone={timeZone} locale={locale}>
                {children}
              </NextIntlClientProviderWrapper>
            </ThemeProviderWrapper>
          </MuiRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
