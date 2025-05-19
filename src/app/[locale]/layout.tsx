// src/app/[locale]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';

import { getSession } from '@/utils/auth';
// Import the new client-only layout wrapper
import ClientLayout from './ClientLayout';

// Material UI SSR imports
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/createEmotionCache';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@/theme'; // Assuming you want to use lightTheme
import CssBaseline from '@mui/material/CssBaseline';

// Import locales from your routing configuration file
import { routing } from '@/i18n/routing'; // Adjust import path if necessary
const locales = routing.locales;


const clientSideEmotionCache = createEmotionCache();


export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

   // Fetch session server-side for initial state
   const session = await getSession();


  return (
    <html lang={locale}>
      <body>
         <CacheProvider value={clientSideEmotionCache}>
             <CssBaseline />
             <ThemeProvider theme={lightTheme}>
                <NextIntlClientProvider locale={locale}>
                     <ClientLayout session={session}>
                         {children}
                     </ClientLayout>
                </NextIntlClientProvider>
             </ThemeProvider>
         </CacheProvider>
      </body>
    </html>
  );
}

// Optional: generateStaticParams can be defined here if you need static rendering for locales
// export async function generateStaticParams() {
//   return locales.map((locale) => ({ locale }));
// }
