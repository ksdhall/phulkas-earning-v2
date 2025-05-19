// src/components/LanguageSwitcherSelect.tsx
// This is a Client Component that handles the actual locale selection and change
// using next/navigation to change the route and thus the locale.
"use client";

// Import hooks from react
import { useState, useTransition, ChangeEvent, ReactNode } from 'react';
// Import hooks from next/navigation
import { useParams, useRouter, usePathname } from 'next/navigation';
// Import MUI components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
// useTranslations is from 'next-intl', but we'll pass it down from the parent
// import { useTranslations } from 'next-intl';


// Define props for this component
interface LanguageSwitcherSelectProps {
  // We'll pass the current locale and translation function from the parent
  currentLocale: string;
  t: (key: string) => string; // Simplified type for translation function
}

const LanguageSwitcherSelect: React.FC<LanguageSwitcherSelectProps> = ({ currentLocale, t }) => {
  // Use Next.js router for navigation
  const router = useRouter();
  // Use Next.js hooks to get current path and params
  const pathname = usePathname();
  const params = useParams();

  // Hook for pending state during transition
  const [isPending, startTransition] = useTransition();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (nextLocale: string) => {
    // Manually construct the new path with the selected locale
    // Assuming the locale is the first segment in the path (e.g., /en/dashboard)
    // This approach might need adjustment based on your exact routing structure
    const segments = pathname.split('/');
    // Replace the current locale segment with the new locale
    segments[1] = nextLocale;
    const newPath = segments.join('/');

    // Start a transition when changing locale
    startTransition(() => {
      // Use router.replace to change the route, which triggers the locale change
      router.replace(newPath);
    });
    handleClose();
  };

  return (
    <Box sx={{ ml: 1 }}> {/* Add some margin */}
       <Button
           id="language-switcher-button"
           aria-controls={open ? 'language-switcher-menu' : undefined}
           aria-haspopup="true"
           aria-expanded={open ? 'true' : undefined}
           onClick={handleClick}
           color="inherit"
           endIcon={<ArrowDropDownIcon />} // Keep MUI icon
           disabled={isPending} // Disable button while transitioning
       >
           {/* Display current locale or a label */}
           {currentLocale.toUpperCase()}
       </Button>
       <Menu
           id="language-switcher-menu"
           anchorEl={anchorEl}
           open={open}
           onClose={handleClose}
           MenuListProps={{
               'aria-labelledby': 'language-switcher-button',
           }}
       >
           {/* Add MenuItems for each supported locale */}
           {/* Replace with your actual supported locales */}
           <MenuItem onClick={() => handleMenuItemClick('en')} selected={currentLocale === 'en'}>
               English
           </MenuItem>
           <MenuItem onClick={() => handleMenuItemClick('ja')} selected={currentLocale === 'ja'}>
               日本語
           </MenuItem>
           {/* Add more MenuItems for other locales if needed */}
       </Menu>
    </Box>
  );
};

export default LanguageSwitcherSelect;
