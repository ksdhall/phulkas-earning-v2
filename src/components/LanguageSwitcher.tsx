"use client";

import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { useTranslations } from 'next-intl';
// Import hooks for routing and locale from next/navigation
import { useParams, useRouter, usePathname } from 'next/navigation';
// Import locales from your routing file
import { routing } from '@/i18n/routing';

// Remove the props interface as locale and handler will be internal
// interface LanguageSwitcherProps {
//   onLocaleChange: (event: SelectChangeEvent<string>) => void;
//   locale: string;
// }

// Component no longer accepts props
const LanguageSwitcher: React.FC = () => {
  const t = useTranslations('language_switcher');
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname
  const params = useParams(); // Get route params, including locale

  // Get the current locale from the params
  const currentLocale = params.locale as string;

  // Access the locales array from the imported routing object
  const locales = routing.locales;

  // Handle locale change internally
  const handleLocaleChange = (event: SelectChangeEvent<string>) => {
    const newLocale = event.target.value;
    // Construct the new URL with the selected locale
    // This logic might need refinement based on your specific routing setup
    const newPath = `/${newLocale}${pathname.startsWith(`/${currentLocale}`) ? pathname.substring(currentLocale.length + 1) : pathname}`;
    router.push(newPath);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="language-switcher-label">{t('label')}</InputLabel>
      <Select
        labelId="language-switcher-label"
        id="language-switcher"
        value={currentLocale} // Use the current locale from params
        label={t('label')}
        onChange={handleLocaleChange} // Use the internal handler
      >
        {locales.map((loc) => (
          <MenuItem key={loc} value={loc}>
            {t(loc)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
