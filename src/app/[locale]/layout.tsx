// src/app/[locale]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';

import { getSession } from '@/utils/auth';
// Import the new client-only layout wrapper
import ClientLayout from './ClientLayout';

// Material UI SSR imports
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/createEmotionCache'; // Import the cache utility
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@/theme'; // Import the specific theme using a named import
import CssBaseline from '@mui/material/CssBaseline';

// Import locales from your routing configuration file
import { routing } from '@/i18n/routing'; // Adjust import path if necessary
const locales = routing.locales;


// Create a client-side Emotion cache shared for the whole app
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
         {/* Material UI SSR setup */}
         <CacheProvider value={clientSideEmotionCache}>
             {/* CssBaseline provides a clean slate for Material UI styles */}
             <CssBaseline />
             {/* Use the imported lightTheme */}
             <ThemeProvider theme={lightTheme}>
                {/* Wrap content with the NextIntlClientProvider */}
                <NextIntlClientProvider locale={locale}>
                     {/* Wrap with our *local* ClientLayout Client Component */}
                     {/* Pass the server-fetched session to the ClientLayout */}
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
