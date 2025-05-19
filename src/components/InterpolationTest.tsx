// src/components/InterpolationTest.tsx
"use client";

import React from 'react';
import Typography from '@mui/material/Typography';
// Import useTranslations from next-intl
import { useTranslations } from 'next-intl';

// Define a very simple component to test interpolation
const InterpolationTest: React.FC = () => {
  // Initialize the translation hook for a specific namespace (e.g., 'dashboard')
  // The argument to useTranslations corresponds to a top-level key in your JSON files.
  const t = useTranslations('dashboard');

  // Hardcoded key from the 'dashboard' namespace that uses interpolation
  // In en.json/ja.json: "dashboard": { "todays_entries": "Today's Entries ({{date}})", ... }
  const testKey = 'todays_entries'; // Use the key relative to the namespace 'dashboard'
  // Hardcoded value for the placeholder
  const testValue = 'HARDCODED_TEST_DATE';

  // Perform the interpolation
  // Pass the key and the interpolation object
  const interpolatedText = t(testKey, { date: testValue });

  // --- Debug Log ---
  // Log the key, the value object, and the resulting text
  console.log("InterpolationTest Component (next-intl):");
  console.log("  Namespace:", 'dashboard');
  console.log("  Key:", testKey);
  console.log("  Full Key:", `dashboard.${testKey}`); // Log the full key for clarity
  console.log("  Value Object:", { date: testValue });
  console.log("  Interpolated Text:", interpolatedText);
  // --- End Debug Log ---


  return (
    // Render the interpolated text
    <Typography variant="h6" color="secondary" sx={{ mt: 2, border: '1px dashed red', p: 1 }}>
      Interpolation Test Component Output (next-intl): {interpolatedText}
    </Typography>
  );
};

export default InterpolationTest;
