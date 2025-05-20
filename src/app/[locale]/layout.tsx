// src/app/[locale]/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css'; // Assuming this is your global CSS
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/components/AuthProvider';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import Layout from '@/components/Layout'; // <--- IMPORT YOUR LAYOUT COMPONENT HERE

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Phulkas Earning App',
  description: 'Track your earnings',
};

export default async function RootLayout(props: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { children } = props;
  const { locale } = await props.params;

  const locales = routing.locales;
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProviderWrapper>
              <Layout>
                {children} {/* Children here will be your actual page content */}
              </Layout>
            </ThemeProviderWrapper>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
