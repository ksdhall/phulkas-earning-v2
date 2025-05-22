// src/app/[locale]/layout.tsx

import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Layout from '@/components/Layout';

export default async function LocaleLayout(props: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { children, params } = props; // Destructure params directly
  const { locale } = params; // Access locale directly

  const locales = routing.locales;
  if (!locales.includes(locale as any)) notFound();

  return (
    <Layout>
      {children}
    </Layout>
  );
}
