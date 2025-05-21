"use client";

import React, { createContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'light',
});

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem('phulkas-theme-mode') as 'light' | 'dark';
      if (storedMode) {
        setMode(storedMode);
      }
    } catch (error) {
      console.error("Failed to read theme from localStorage:", error);
    }
  }, []);

  const themeContextValue = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          try {
            localStorage.setItem('phulkas-theme-mode', newMode);
          } catch (error) {
            console.error("Failed to save theme to localStorage:", error);
          }
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? '#212121' : '#e0e0e0',
            secondary: mode === 'light' ? '#757575' : '#bdbdbd',
          },
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12, // This will apply to cards, dialogs, etc.
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 12,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          // REMOVED: MuiAppBar styleOverrides if they were present
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProviderWrapper;
