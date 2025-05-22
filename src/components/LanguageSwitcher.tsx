"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { MenuItem, Select, FormControl } from '@mui/material';
import React from 'react';
import { useTranslations } from 'next-intl';

const LanguageSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const t = useTranslations('language_switcher');

  const handleChange = (event: any) => {
    const newLocale = event.target.value;
    const newPathname = `/${newLocale}${pathname.substring(3)}`;
    
    router.push(newPathname);
    router.refresh();
  };

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
      <Select
        value={currentLocale}
        onChange={handleChange}
        displayEmpty
        inputProps={{ 'aria-label': t('label') }}
      >
        <MenuItem value="en">{t('en')}</MenuItem>
        <MenuItem value="ja">{t('ja')}</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
