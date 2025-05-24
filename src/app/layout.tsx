// src/app/layout.tsx
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { authOptions } from '@/auth';
import { getServerSession } from 'next-auth';
import { SessionProvider } from '@/components/SessionProvider';
import MuiRegistry from '@/components/MuiRegistry';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import { AppConfigProvider } from '@/context/AppConfigContext'; // Import AppConfigProvider
// No need for 'headers' here for config fetching anymore

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Phulkas Earnings',
  description: 'Track your daily earnings',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // No longer fetching initialAppConfig directly here.
  // AppConfigProvider will handle it on the client side after session is ready.

  return (
    <html lang="en">
      <body className={inter.className}>
        <MuiRegistry>
          <ThemeProviderWrapper>
            <SessionProvider session={session}>
              <AppConfigProvider> {/* No initialConfig prop needed here */}
                {children}
              </AppConfigProvider>
            </SessionProvider>
          </ThemeProviderWrapper>
        </MuiRegistry>
      </body>
    </html>
  );
}
