// src/context/ThemeContext.tsx
"use client"; // This directive MUST be at the very top

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { red } from '@mui/material/colors'; // Example import if you use specific colors

// Define the shape of the context value
interface ThemeContextType {
  currentTheme: PaletteMode; // 'light' or 'dark'
  toggleTheme: () => void;
}

// Create the context with a default undefined value
// createContext should only be called in client components
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to easily access the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // This hook must be used within a ThemeProvider
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
interface AppThemeProviderProps { // Renamed from ThemeProviderProps to avoid potential conflicts
  children: ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  // State to manage the current theme mode ('light' or 'dark')
  const [mode, setMode] = useState<PaletteMode>('light'); // Default to light theme

  // Function to toggle the theme mode
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize the theme object to avoid unnecessary re-creations
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Use the current mode
          // You can customize your palette further here
          // primary: {
          //   main: '#556cd6',
          // },
          // secondary: {
          //   main: '#19857b',
          // },
          // error: {
          //   main: red.A400, // Example using imported color
          // },
        },
      }),
    [mode], // Recreate theme only when mode changes
  );

  // Memoize the context value
  const contextValue = useMemo(() => ({ currentTheme: mode, toggleTheme }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Remember to wrap your root layout (app/layout.tsx) with <AppThemeProvider>
// to make the theme context available throughout your application.
