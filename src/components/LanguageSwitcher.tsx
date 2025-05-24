"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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

  useEffect(() => {
    if (currentLocale && currentLocale !== locale) {
      setLocale(currentLocale);
    }
  }, [currentLocale, locale]);

  const handleChange = useCallback((event: { target: { value: unknown } }) => { // Using useCallback
    const newLocale = event.target.value as string;
    setLocale(newLocale);

    const newPath = `/${newLocale}${pathname.substring(`/${currentLocale}`.length)}`;
    
    router.push(newPath);
    router.refresh();
  }, [currentLocale, pathname, router]);

  const desktopTextColor = theme.palette.text.primary;
  const desktopBackgroundColor = 'transparent';
  const desktopBorderColor = theme.palette.primary.dark;
  const desktopFocusedBorderColor = theme.palette.primary.light;

  const mobileTextColor = theme.palette.text.primary;
  const mobileBackgroundColor = 'transparent';
  const mobileBorderColor = theme.palette.divider;
  const mobileFocusedBorderColor = theme.palette.primary.main;

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
      <InputLabel 
        id="language-switcher-label" 
        sx={{ 
          color: { xs: mobileTextColor, md: desktopTextColor }
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
          color: { xs: mobileTextColor, md: desktopTextColor },
          backgroundColor: { xs: mobileBackgroundColor, md: desktopBackgroundColor },
          borderRadius: theme.shape.borderRadius,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileBorderColor, md: desktopBorderColor },
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileBorderColor, md: desktopBorderColor },
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: { xs: mobileFocusedBorderColor, md: desktopFocusedBorderColor },
          },
          '& .MuiSelect-icon': {
            color: { xs: mobileTextColor, md: desktopTextColor },
          },
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <MenuItem value="en" sx={{ color: mobileTextColor }}>{t('en')}</MenuItem> 
        <MenuItem value="ja" sx={{ color: mobileTextColor }}>{t('ja')}</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
