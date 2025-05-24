// src/components/ConfigPageClient.tsx
"use client";

import React from 'react';
import { Typography, Box, Alert } from '@mui/material'; // Added Alert
import AppConfigForm from '@/components/AppConfigForm';

interface ConfigPageClientProps {
  title: string;
  initialConfig: Record<string, number>; // Added initialConfig prop
  initialError: string | null; // Added initialError prop
}

const ConfigPageClient: React.FC<ConfigPageClientProps> = ({ title, initialConfig, initialError }) => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      {initialError && <Alert severity="error" sx={{ mb: 2 }}>{initialError}</Alert>}
      <AppConfigForm initialConfig={initialConfig} /> {/* Pass initialConfig to form */}
    </Box>
  );
};

export default ConfigPageClient;
