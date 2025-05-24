// src/components/AppConfigForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import { useTranslations } from 'next-intl';

// Define the shape of the configuration items
interface ConfigItem {
  key: string;
  value: number;
  description?: string;
}

// Define the props for the component
interface AppConfigFormProps {
  initialConfig: Record<string, number>;
  onSaveSuccess?: () => void; // Optional callback for successful save
}

const AppConfigForm: React.FC<AppConfigFormProps> = ({ initialConfig, onSaveSuccess }) => {
  const t = useTranslations('config_form');
  const tErrors = useTranslations('errors'); // Use this for error messages

  // State to hold the current configuration values
  const [config, setConfig] = useState<Record<string, number>>(initialConfig);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Descriptions for each config key (for display in the UI)
  const configDescriptions: Record<string, string> = {
    LUNCH_FOOD_BASE_INCOME: t('lunch_food_base_income_desc'),
    LUNCH_FOOD_OVERAGE_SHARE_PERCENT: t('lunch_food_overage_share_percent_desc'),
    LUNCH_DRINK_SHARE_PERCENT: t('lunch_drink_share_percent_desc'),
    DINNER_FOOD_OUR_SHARE_PERCENT: t('dinner_food_our_share_percent_desc'),
    DINNER_FOOD_COMMON_POOL_PERCENT: t('dinner_food_common_pool_percent_desc'),
    DINNER_DRINK_COMMON_POOL_PERCENT: t('dinner_drink_common_pool_percent_desc'),
  };

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = useCallback((key: string, value: string) => {
    setError(null);
    setSuccess(null);
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value === '' ? '' : Number(value),
    }));
  }, []);

  const validateField = useCallback((key: string, value: number | string): string | null => {
    if (value === '' || value === null || value === undefined) {
      return tErrors('required');
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return tErrors('invalid_number');
    }
    if (key.includes('PERCENT') && (numValue < 0 || numValue > 1)) {
      return tErrors('percentage_range');
    }
    if (key === 'LUNCH_FOOD_BASE_INCOME' && numValue < 0) {
      return tErrors('positive_number');
    }
    return null;
  }, [tErrors]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const updatedConfigArray: ConfigItem[] = Object.keys(config).map((key) => ({
      key,
      value: Number(config[key]),
      description: configDescriptions[key],
    }));

    let hasValidationError = false;
    const newErrors: Record<string, string> = {};
    for (const item of updatedConfigArray) {
      const fieldError = validateField(item.key, item.value);
      if (fieldError) {
        newErrors[item.key] = fieldError;
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      setError(tErrors('form_validation_failed')); // CRITICAL FIX: Use tErrors here
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfigArray),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || tErrors('failed_update_config')); // CRITICAL FIX: Use tErrors here
      }

      setSuccess(t('update_success'));
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      console.error('Error updating config:', err);
      setError(err.message || tErrors('failed_update_config')); // CRITICAL FIX: Use tErrors here
    } finally {
      setIsSubmitting(false);
    }
  }, [config, configDescriptions, onSaveSuccess, t, tErrors, validateField]);

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        {t('title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {Object.keys(config).map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                label={configDescriptions[key]}
                type="number"
                value={config[key] === undefined ? '' : config[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                  step: key.includes('PERCENT') ? '0.01' : '1',
                }}
                error={!!validateField(key, config[key])}
                helperText={validateField(key, config[key])}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ borderRadius: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('save_button')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default AppConfigForm;
