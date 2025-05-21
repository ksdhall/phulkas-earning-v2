// src/app/[locale]/layout.tsx

import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Layout from '@/components/Layout';

export default async function LocaleLayout(props: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { children, params } = props; // FIX: Re-added children to destructuring
  const { locale } = params; // Then destructure locale from params

  const locales = routing.locales;
  if (!locales.includes(locale as any)) notFound();

  return (
    <Layout>
      {children}
    </Layout>
  );
}
