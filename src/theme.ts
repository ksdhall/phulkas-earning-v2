// src/theme.ts
// This file defines the custom light and dark themes for the application.

import { createTheme } from '@mui/material/styles';
import { blueGrey, cyan, lightBlue } from '@mui/material/colors'; // Import colors

// Define the light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light', // Set mode to light
    primary: {
      main: blueGrey[700], // A darker blue-grey for primary
    },
    secondary: {
      main: cyan[600], // A cyan for secondary
    },
    background: {
      default: '#f4f6f8', // Light background
      paper: '#ffffff', // White paper background
    },
    text: {
      primary: blueGrey[900], // Dark text
      secondary: blueGrey[600], // Muted text
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif', // Use Roboto or your preferred font
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: blueGrey[800], // Darker AppBar in light mode
        },
      },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // Prevent uppercase text
            },
        },
    },
    // You can add more component customizations here
  },
});

// Define the dark theme (blueish)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Set mode to dark
    primary: {
      main: lightBlue[500], // A vibrant blue for primary
    },
    secondary: {
      main: cyan[300], // A lighter cyan for secondary
    },
    background: {
      default: '#121212', // Very dark background
      paper: '#1e1e1e', // Slightly lighter paper background
    },
    text: {
      primary: '#ffffff', // White text
      secondary: blueGrey[300], // Lighter muted text
    },
  },
   typography: {
    fontFamily: 'Roboto, sans-serif', // Use Roboto or your preferred font
  },
   components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: blueGrey[900], // Even darker AppBar in dark mode
        },
      },
    },
     MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none', // Prevent uppercase text
            },
        },
    },
    // You can add more component customizations here
  },
});
