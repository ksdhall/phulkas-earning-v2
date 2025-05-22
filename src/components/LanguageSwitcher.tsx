"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { useTheme } from '@mui/material/styles';

const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations('language_switcher');
  const theme = useTheme();

  const currentLocale = params.locale as string;
  const [locale, setLocale] = useState(currentLocale);

  // Update state if locale from params changes (e.g., on initial load or navigation)
  useEffect(() => {
    if (currentLocale && currentLocale !== locale) {
      setLocale(currentLocale);
    }
  }, [currentLocale, locale]);

  const handleChange = (event: { target: { value: unknown } }) => {
    const newLocale = event.target.value as string;
    setLocale(newLocale);

    const newPath = `/${newLocale}${pathname.substring(`/${currentLocale}`.length)}`;
    
    router.push(newPath);
    router.refresh();
  };

  // Colors for desktop (on blue primary background)
  const desktopTextColor = theme.palette.primary.contrastText;
  const desktopBackgroundColor = theme.palette.primary.main;
  const desktopBorderColor = theme.palette.primary.dark;
  const desktopFocusedBorderColor = theme.palette.primary.light;

  // Colors for mobile (on default background, e.g., white in light theme)
  const mobileTextColor = theme.palette.text.primary; // Standard text color
  const mobileBackgroundColor = 'transparent'; // Or theme.palette.background.paper if you want a solid background
  const mobileBorderColor = theme.palette.divider; // A subtle border
  const mobileFocusedBorderColor = theme.palette.primary.main; // Standard focused color

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
      <InputLabel 
        id="language-switcher-label" 
        sx={{ 
          color: { xs: mobileTextColor, md: desktopTextColor } // Responsive label color
        }} 
      >
        {t('label')}
      </InputLabel>
      <Select
        labelId="language-switcher-label"
        value={locale}
        onChange={handleChange}
        label={t('label')}
        sx={{
          color: { xs: mobileTextColor, md: desktopTextColor }, // Responsive selected value text color
          backgroundColor: { xs: mobileBackgroundColor, md: desktopBackgroundColor }, // Responsive background color
          borderRadius: theme.shape.borderRadius,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileBorderColor, md: desktopBorderColor }, // Responsive border color
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileBorderColor, md: desktopBorderColor }, // Responsive hover border color
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileFocusedBorderColor, md: desktopFocusedBorderColor }, // Responsive focused border color
          },
          '& .MuiSelect-icon': {
            color: { xs: mobileTextColor, md: desktopTextColor }, // Responsive dropdown icon color
          },
          // Style the Paper component (dropdown menu) that holds the MenuItems
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.background.paper, // Dropdown background is always theme-appropriate
          },
        }}
      >
        {/* Menu items should always use defaultTextColor as they are on a default background */}
        <MenuItem value="en" sx={{ color: mobileTextColor }}>{t('en')}</MenuItem> 
        <MenuItem value="ja" sx={{ color: mobileTextColor }}>{t('ja')}</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
