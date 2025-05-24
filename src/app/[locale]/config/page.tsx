// src/app/[locale]/config/page.tsx
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server'; // Use getTranslations for server components
import ConfigPageClient from '@/components/ConfigPageClient';
import { headers } from 'next/headers'; // Import headers for API call

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ja' }];
}

export default async function Page(props: { params: { locale: string } }) {
  const { locale } = await props.params; // Await params

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  // Fetch translations on the server side
  const t = await getTranslations('config_page', { locale });

  // CRITICAL FIX: Fetch initial config data on the server side
  let initialConfig: Record<string, number> = {};
  let initialConfigError: string | null = null;
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api/config`;
    const requestHeaders = new Headers(headers());
    const cookieHeader = requestHeaders.get('cookie');

    const fetchOptions: RequestInit = {
      cache: 'no-store',
    };
    if (cookieHeader) {
      fetchOptions.headers = { 'Cookie': cookieHeader };
    }

    const response = await fetch(apiUrl, fetchOptions);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch initial configuration.');
    }
    initialConfig = await response.json();
  } catch (e: any) {
    console.error("ConfigPage (Server): Error fetching initial config:", e);
    initialConfigError = e.message || "Failed to load initial configuration.";
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ConfigPageClient title={t('title')} initialConfig={initialConfig} initialError={initialConfigError} />
    </NextIntlClientProvider>
  );
}
