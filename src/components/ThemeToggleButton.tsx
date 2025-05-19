// src/components/ThemeToggleButton.tsx
// This is a Client Component to toggle between light and dark themes.
"use client";

import React from 'react';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box'; // Import Box
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Import dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Import light mode icon
import { useTheme } from '@/context/ThemeContext'; // Import your custom theme hook


const ThemeToggleButton: React.FC = () => {
  // Use the custom theme hook to access current theme and toggle function
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <Box sx={{ ml: 1 }}> {/* Add some margin */}
      <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
        {currentTheme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default ThemeToggleButton;
