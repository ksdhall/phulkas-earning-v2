// src/components/DateRangeFilter.tsx
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

interface DateRangeFilterProps {
  onApplyFilter: (fromDate: string, toDate: string) => void;
  initialFromDate: string;
  initialToDate: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onApplyFilter,
  initialFromDate,
  initialToDate,
}) => {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);

  const t = useTranslations('date_range_filter');
  const tSummary = useTranslations('summary');


  const handleApply = () => {
    onApplyFilter(fromDate, toDate);
  };

  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>{tSummary('filter_title')}</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            label={t('from_date')}
            type="date"
            fullWidth
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label={t('to_date')}
            type="date"
            fullWidth
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            onClick={handleApply}
            fullWidth
            sx={{ height: '56px' }}
          >
            {t('apply')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DateRangeFilter;
