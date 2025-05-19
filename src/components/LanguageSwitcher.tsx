// src/components/LanguageSwitcher.tsx
"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChangeEvent } from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';

const locales = ['en', 'ja'];

const StyledSelect = styled(Select)(({ theme }) => ({
  color: theme.palette.common.white,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.common.white,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.common.white,
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.common.white,
  },
  '& .MuiSelect-select': {
      color: theme.palette.common.white,
  }
}));


const LanguageSwitcher = () => {
  const locale = useLocale();
  const t = useTranslations('localeSwitcher');
  const router = useRouter();
  const pathname = usePathname();

  const onLocaleChange = (event: ChangeEvent<{ value: unknown }>) => {
    const nextLocale = event.target.value as string;
    const newPathname = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(newPathname);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel id="locale-switcher-label"
         sx={{ color: 'white' }}
      >{t('label')}</InputLabel>
      <StyledSelect
        labelId="locale-switcher-label"
        id="locale-switcher"
        value={locale}
        label={t('label')}
        onChange={onLocaleChange}
      >
        {locales.map((loc) => (
          <MenuItem key={loc} value={loc}>
            {t(`locale_${loc}` as any)}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
};

export default LanguageSwitcher;
