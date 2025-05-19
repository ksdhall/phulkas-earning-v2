// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../page.module.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
// Import the routing object and access locales from it
import { routing } from '@/i18n/routing'; // Import the routing object
// Corrected import path to your existing AuthProvider component
import { AuthProvider } from '@/components/AuthProvider'; // Import AuthProvider from its correct location
// Import the ThemeProviderWrapper Client Component
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper'; // Adjust the path if needed

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Phulkas Earning App',
  description: 'Track your earnings',
};

// Define the RootLayout component
export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // Access the locales array from the imported routing object
  const locales = routing.locales;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {/* Wrap the entire application with the AuthProvider */}
        {/* This is already a Client Component wrapper as per your code */}
        <AuthProvider>
          {/* Wrap the application with NextIntlClientProvider */}
          <NextIntlClientProvider messages={messages}>
            {/* Wrap the application with the ThemeProviderWrapper Client Component */}
            {/* This establishes the client boundary for the theme context */}
            <ThemeProviderWrapper>
              {children}
            </ThemeProviderWrapper>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
