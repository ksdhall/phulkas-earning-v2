"use client";

import React from 'react';
import { Box, TextField, Button, Grid, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

// Export the interface so it can be imported in other files
export interface DateRangeFilterProps {
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  fromDate: string;
  toDate: string;
}

// Export the component as default
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onFromDateChange,
  onToDateChange,
  fromDate,
  toDate
}) => {
  // Use useTranslations hook correctly
  const t = useTranslations('date_range_filter');
  const tSummary = useTranslations('summary'); // Assuming summary translations have filter title

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>{tSummary('filter_title')}</Typography>
      <Grid
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
        gap={2}
        alignItems="center"
      >
        <TextField
          label={t('from_date')}
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label={t('to_date')}
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
    </Box>
  );
};

// Export the component as default
export default DateRangeFilter;
