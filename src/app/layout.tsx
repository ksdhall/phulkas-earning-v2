// src/app/layout.tsx

import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl'; // Import from 'next-intl' (client side)
// Removed getRequestConfig import
// Removed getLocale, getMessages imports

import { AuthProvider } from '@/components/AuthProvider';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import MuiRegistry from '@/components/MuiRegistry';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Earning App",
  description: "Track daily earnings",
};

export default function RootLayout({ // Changed back to a non-async function
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // IMPORTANT: Do NOT call getLocale() or getMessages() or getRequestConfig() here.
  // NextIntlClientProvider will automatically get the context from the middleware/i18n/request.ts setup.
  // The 'locale' for html lang attribute will be set by next-intl automatically.

  return (
    <html lang="en"> {/* Set a default lang, next-intl will override based on route */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <MuiRegistry>
            <ThemeProviderWrapper>
              {/* NextIntlClientProvider will automatically receive messages and locale from context */}
              <NextIntlClientProvider>
                {children}
              </NextIntlClientProvider>
            </ThemeProviderWrapper>
          </MuiRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
