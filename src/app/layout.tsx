// src/app/layout.tsx

import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import getRequestConfig from '@/i18n/request';
// Removed getLocale as we will rely on params.locale directly
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
  params: { locale: rootLocaleParam }, // Destructure locale from params here
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string }; // Add params to RootLayout props
}>) {

  // CRITICAL FIX: Use rootLocaleParam directly as the locale for getRequestConfig.
  // This is the locale segment from the URL (e.g., 'en', 'ja').
  const { locale, messages, timeZone } = await getRequestConfig({ locale: rootLocaleParam }); 

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <MuiRegistry>
            <ThemeProviderWrapper>
              <NextIntlClientProviderWrapper messages={messages} timeZone={timeZone}>
                {children}
              </NextIntlClientProviderWrapper>
            </ThemeProviderWrapper>
          </MuiRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
