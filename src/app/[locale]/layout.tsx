// src/app/[locale]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Layout from '@/components/Layout'; // Assuming this is your main layout component

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout(props: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = await props.params;

  if (!routing.locales.includes(locale as any)) notFound();

  const { messages } = await getRequestConfig({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Layout>{props.children}</Layout>
    </NextIntlClientProvider>
  );
}
