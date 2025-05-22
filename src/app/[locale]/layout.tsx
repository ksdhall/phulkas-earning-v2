// src/app/[locale]/layout.tsx

import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Layout from '@/components/Layout'; // Assuming this is your main layout component

export default async function LocaleLayout(props: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { children, params } = props;
  const { locale } = params; // Access locale directly, should be fine here

  const locales = routing.locales;
  if (!locales.includes(locale as any)) notFound();

  return (
    <Layout> {/* This should wrap your main content, including the menu/header */}
      {children}
    </Layout>
  );
}
