// src/components/ThemeToggleButton.tsx
"use client"; // This component also needs to be a Client Component

import React from 'react';
import { Box, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon for dark mode
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon for light mode
// Import the useTheme hook from your theme context file
import { useTheme } from '@/context/ThemeContext'; // Adjust the path if your context file is elsewhere

const ThemeToggleButton: React.FC = () => {
  // Use the custom theme hook to access current theme mode and toggle function
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <Box sx={{ ml: 1 }}> {/* Add some margin */}
      <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
        {/* Show sun icon in light mode, moon icon in dark mode */}
        {currentTheme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default ThemeToggleButton;
