// src/components/Layout.tsx
"use client";

import React, { ReactNode, useCallback } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
// CRITICAL FIX: Use Link, useRouter, usePathname from next-intl/navigation for locale awareness
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton'; // Ensure this component exists and is correctly implemented
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const t = useTranslations('layout');
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Changed from 'sm' to 'md' for consistency with previous desktop breakpoint

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const router = useRouter(); // From next-intl/navigation
  const currentLocale = usePathname().split('/')[1] || 'en'; // Get locale from pathname, safer than useParams

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Define navigation items
  const navItems = [
    { name: t('dashboard_link'), path: '/dashboard' },
    { name: t('summary_link'), path: '/summary' },
    { name: t('purchases_link'), path: '/purchases' },
    { name: t('config_link'), path: '/config' }, // CRITICAL FIX: Added config link
  ];

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Typography variant="h6" sx={{ my: 2 }}>
        {t('app_title')}
      </Typography>
      <List sx={{ flexGrow: 1 }}>
        {isAuthenticated && (
          <>
            {navItems.map((item) => ( // Loop through navItems for drawer
              <ListItem disablePadding key={item.name}>
                <ListItemButton component={Link} href={item.path}> {/* Use next-intl Link */}
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={() => signOut({ callbackUrl: `/${currentLocale}` })}>
                <ListItemText primary={t('sign_out_button')} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
      
      {isAuthenticated && <Divider sx={{ my: 1 }} />}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <LanguageSwitcher />
        <ThemeToggleButton /> {/* CRITICAL FIX: ThemeToggleButton is back */}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ borderRadius: 0 }}>
        <Toolbar sx={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {isMobile && isAuthenticated && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {/* CRITICAL FIX: Use next-intl Link for logo, ensure it's locale-aware */}
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <img
                src="/phulka.png"
                alt="Phulkas App Logo"
                style={{ height: 50, width: 50, borderRadius: '50%', marginRight: 8 }}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  e.currentTarget.src = "https://placehold.co/50x50/CCCCCC/000000?text=LOGO";
                }}
              />
              <Typography variant="h6" component="div" sx={{ display: 'block' }}>
                {t('app_title')}
              </Typography>
            </Link>
          </Box>

          {!isMobile && isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems.map((item) => ( // Loop through navItems for desktop
                <Button
                  key={item.name}
                  color="inherit"
                  component={Link} // Use next-intl Link
                  href={item.path}
                >
                  {item.name}
                </Button>
              ))}
              <Button color="inherit" onClick={() => signOut({ callbackUrl: `/${currentLocale}` })}>
                {t('sign_out_button')}
              </Button>
            </Box>
          )}

          {/* CRITICAL FIX: Ensure LanguageSwitcher and ThemeToggleButton are always visible on desktop */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <LanguageSwitcher />
              <ThemeToggleButton /> {/* ThemeToggleButton is back */}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' }, // Changed from 'sm' to 'md'
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, display: 'flex', flexDirection: 'column' },
          }}
        >
          {drawer}
        </Drawer>
      </nav>

      <Container sx={{ mt: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
