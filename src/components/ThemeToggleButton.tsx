"use client";

import React, { useContext } from 'react';
import { IconButton } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { ThemeContext } from './ThemeProviderWrapper'; // Import the ThemeContext

const ThemeToggleButton: React.FC = () => {
  const { toggleColorMode, mode } = useContext(ThemeContext);

  return (
    <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeToggleButton;
