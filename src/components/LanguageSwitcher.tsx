"use client";

import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

const LanguageSwitcher: React.FC = () => {
  const t = useTranslations('language_switcher');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLocale = params.locale as string;
  const locales = routing.locales;

  const handleLocaleChange = (event: SelectChangeEvent<string>) => {
    const newLocale = event.target.value;
    const newPath = `/${newLocale}${pathname.startsWith(`/${currentLocale}`) ? pathname.substring(currentLocale.length + 1) : pathname}`;
    router.push(newPath);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120, '& .MuiInputLabel-root': { color: 'inherit' }, '& .MuiSelect-icon': { color: 'inherit' } }}>
      <InputLabel id="language-switcher-label" color="primary" sx={{ color: 'inherit' }}>{t('label')}</InputLabel>
      <Select
        labelId="language-switcher-label"
        id="language-switcher"
        value={currentLocale}
        label={t('label')}
        onChange={handleLocaleChange}
        color="primary" // Ensures the select component's primary color is used
        sx={{
          color: 'inherit', // Inherit text color from parent (AppBar's Toolbar)
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'inherit', // Inherit border color
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'inherit', // Inherit border color on hover
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'inherit', // Inherit border color when focused
          },
        }}
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
