"use client";

import React, { ReactNode } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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
            <ListItem disablePadding>
              <ListItemButton component={Link} href={`/${session?.user?.locale || 'en'}/dashboard`}>
                <ListItemText primary={t('dashboard_link')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href={`/${session?.user?.locale || 'en'}/summary`}>
                <ListItemText primary={t('summary_link')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => signOut()}>
                <ListItemText primary={t('sign_out_button')} />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
      
      {isAuthenticated && <Divider sx={{ my: 1 }} />}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <LanguageSwitcher />
        <ThemeToggleButton />
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

          {/* Logo and App Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <img
                src="/phulka.png"
                alt="Phulkas App Logo"
                style={{ height: 50, width: 50, borderRadius: '50%', marginRight: 8 }} // Increased size to 50x50
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  e.currentTarget.src = "https://placehold.co/50x50/CCCCCC/000000?text=LOGO"; // Fallback with new size
                }}
              />
              <Typography variant="h6" component="div" sx={{ display: 'block' }}> {/* Always display the title */}
                {t('app_title')}
              </Typography>
            </Link>
          </Box>

          {!isMobile && isAuthenticated && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" component={Link} href={`/${session?.user?.locale || 'en'}/dashboard`}>
                {t('dashboard_link')}
              </Button>
              <Button color="inherit" component={Link} href={`/${session?.user?.locale || 'en'}/summary`}>
                {t('summary_link')}
              </Button>
              <Button color="inherit" onClick={() => signOut()}>
                {t('sign_out_button')}
              </Button>
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <LanguageSwitcher />
              <ThemeToggleButton />
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
            display: { xs: 'block', sm: 'none' },
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
