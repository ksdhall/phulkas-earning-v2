// src/theme.ts
import { createTheme } from '@mui/material/styles';
import { Inter } from 'next/font/google';

const inter = Inter({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Define your light and dark palettes
const lightPalette = {
  primary: {
    main: '#1976d2', // Blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff', // White text on primary blue
  },
  secondary: {
    main: '#dc004e', // Pink
    light: '#ff3378',
    dark: '#9a0036',
    contrastText: '#fff',
  },
  background: {
    default: '#f4f6f8', // Light grey background
    paper: '#ffffff', // White paper background
  },
  text: {
    primary: '#212121', // Dark text
    secondary: '#757575', // Grey text
  },
  divider: '#e0e0e0',
  mode: 'light' as const, // Explicitly define mode
};

const darkPalette = {
  primary: {
    main: '#90caf9', // Light blue for primary in dark mode (e.g., AppBar, chart bars)
    light: '#e3f2fd',
    dark: '#42a5f5',
    contrastText: '#000', // Black text on light primary for better contrast
  },
  secondary: {
    main: '#f48fb1', // Light pink
    light: '#ffc1e3',
    dark: '#ad1457',
    contrastText: '#000',
  },
  background: {
    default: '#121212', // Dark background
    paper: '#1e1e1e', // Darker paper background
  },
  text: {
    primary: '#ffffff', // White text for primary readability
    secondary: '#e0e0e0', // Very light grey for secondary text
  },
  divider: '#333333',
  mode: 'dark' as const, // Explicitly define mode
};

// Create the light theme
export const lightTheme = createTheme({
  palette: lightPalette,
  typography: {
    fontFamily: inter.style.fontFamily,
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
          borderRadius: 8,
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
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

// Create the dark theme
export const darkTheme = createTheme({
  palette: darkPalette,
  typography: {
    fontFamily: inter.style.fontFamily,
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
          borderRadius: 8,
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
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});
