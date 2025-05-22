// src/components/InterpolationTest.tsx
"use client";

import React from 'react';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

const InterpolationTest: React.FC = () => {
  const t = useTranslations('dashboard');
  const testKey = 'todays_entries';
  const testValue = 'HARDCODED_TEST_DATE';
  const interpolatedText = t(testKey, { date: testValue });

  return (
    <Typography variant="h6" color="secondary" sx={{ mt: 2, border: '1px dashed red', p: 1 }}>
      Interpolation Test Component Output (next-intl): {interpolatedText}
    </Typography>
  );
};

export default InterpolationTest;
