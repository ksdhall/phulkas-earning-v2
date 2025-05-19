// src/components/ThemeProviderWrapper.tsx
"use client"; // This file MUST be a Client Component

import React, { ReactNode } from 'react';
// Import your AppThemeProvider from your theme context file
import { AppThemeProvider } from '@/context/ThemeContext'; // Adjust the path if needed

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

// This is a Client Component that simply renders the AppThemeProvider
// and its children. This establishes the client boundary.
const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  return (
    <AppThemeProvider>
      {children}
    </AppThemeProvider>
  );
};

export default ThemeProviderWrapper;
