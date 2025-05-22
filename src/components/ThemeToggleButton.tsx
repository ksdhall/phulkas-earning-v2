"use client";

import React, { useContext } from 'react';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon for dark mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon for light mode
import { ThemeContext } from './ThemeProviderWrapper'; // Import the ThemeContext

const ThemeToggleButton: React.FC = () => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    // This should ideally not happen if ThemeProviderWrapper is correctly wrapping the app
    console.error('ThemeContext not found. Ensure ThemeToggleButton is wrapped by ThemeProviderWrapper.');
    return null;
  }

  const { toggleTheme, mode } = themeContext;

  return (
    <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
};

export default ThemeToggleButton;
