// src/components/Layout.tsx
"use client";

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher'; // Assuming this exists
import ThemeToggleButton from '@/components/ThemeToggleButton'; // Assuming this exists


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const params = useParams();
  const locale = params.locale as string;

  const t = useTranslations('nav'); // Translations for navigation

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href={`/${locale}/dashboard`} // Link to dashboard
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              {t('app_name')} {/* Use translation */}
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              {/* Mobile menu - can add Drawer here if needed */}
               <Typography
                  variant="h5"
                  noWrap
                  component={Link}
                  href={`/${locale}/dashboard`} // Link to dashboard
                  sx={{
                    mr: 2,
                    display: { xs: 'flex', md: 'none' },
                    flexGrow: 1,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {t('app_name')} {/* Use translation */}
                </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {session && ( // Show links only if authenticated
                <>
                  <Button
                    component={Link}
                    href={`/${locale}/dashboard`} // Link to dashboard
                    sx={{ my: 2, color: 'white', display: 'block' }}
                  >
                    {t('dashboard')} {/* Use translation */}
                  </Button>
                  <Button
                    component={Link}
                    href={`/${locale}/summary`} // Link to summary
                    sx={{ my: 2, color: 'white', display: 'block' }}
                  >
                    {t('summary')} {/* Use translation */}
                  </Button>
                </>
              )}
            </Box>

            {/* Right side: Auth status, Language Switcher, Theme Toggle */}
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 {session ? (
                     <>
                        <Typography variant="body2" sx={{ mr: 2, color: 'white' }}>
                            {t('logged_in_as', { name: session.user?.name || 'User' })} {/* Use translation */}
                        </Typography>
                        <Button color="inherit" onClick={() => signOut()}>
                            {t('logout')} {/* Use translation */}
                        </Button>
                     </>
                 ) : (
                      // Optional: Show login link if not authenticated
                      // <Button component={Link} href={`/${locale}`} color="inherit">
                      //     {t('login')}
                      // </Button>
                      null // Hide auth status if not logged in
                 )}
                {/* Language Switcher */}
                <LanguageSwitcher /> {/* Assuming this component exists and is a Client Component */}

                {/* Theme Toggle Button */}
                <ThemeToggleButton /> {/* Assuming this component exists and is a Client Component */}

             </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children} {/* This is where the page content is rendered */}
      </Container>

      {/* Optional Footer */}
      {/* <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Phulka's Earning App
          </Typography>
        </Container>
      </Box> */}
    </Box>
  );
};

export default Layout;
