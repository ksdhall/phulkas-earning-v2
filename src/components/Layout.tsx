// src/components/Layout.tsx
"use client";

import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import Button from '@mui/material/Button';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const t = useTranslations('layout');
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              {t('app_title')}
            </Link>
          </Typography>

          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} href={`/${session?.user?.locale || 'en'}/dashboard`}> {/* Use session locale for links */}
                {t('dashboard_link')}
              </Button>
              {/* REMOVED: Add Bill link */}
              {/* <Button color="inherit" component={Link} href="/en/add-bill">
                {t('add_bill_link')}
              </Button> */}
              <Button color="inherit" component={Link} href={`/${session?.user?.locale || 'en'}/summary`}> {/* Use session locale for links */}
                {t('summary_link')}
              </Button>
               {/* Removed the user email display for brevity, add back if needed */}
              <Button color="inherit" onClick={() => signOut()}>
                {t('sign_out_button')}
              </Button>
            </>
          )}

          <LanguageSwitcher />
          <ThemeToggleButton />
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
